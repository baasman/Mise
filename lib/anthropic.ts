// Mise — Claude integration. Two narrow, structured uses only:
//   estimateFlavor  (Opus 5.5)  — ground an off-pantry ingredient's 7-axis
//                                  profile + aromas. Presented as an *estimate*.
//   suggestionWhy   (Haiku 4.5) — phrase the one-line reason for already-ranked
//                                  candidates. Ranking stays deterministic.
// Never used to "generate the dish."
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  AXES,
  ROLES,
  TEMPERATURES,
  TEXTURES,
  ZERO_AXES,
  type AxisMap,
  type Role,
  type Temperature,
  type Texture,
} from "./domain";

export const ESTIMATE_MODEL = "claude-opus-5-5";
// Set explicitly: Opus 5.5 defaults to "medium" (earlier Opus defaulted to "high").
// A calibrated 7-number estimate doesn't need deep thinking; try "low" if latency matters.
const ESTIMATE_EFFORT = "medium";
// Claude Haiku 4.5 is the current Haiku.
const WHY_MODEL = "claude-haiku-4-5";
// On a safety-classifier decline, the API re-runs the request on Anthropic's
// recommended model for that refusal category instead of returning the refusal.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new ApiKeyMissing();
  if (!client) client = new Anthropic({ apiKey: key });
  return client;
}

export class ApiKeyMissing extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "ApiKeyMissing";
  }
}

// The model (and any fallback) declined; the cook gets an unprofiled ingredient.
export class EstimateRefused extends Error {
  constructor(category: string | null) {
    super(`estimate refused${category ? ` (${category})` : ""}`);
    this.name = "EstimateRefused";
  }
}

function firstText(content: { type: string; text?: string }[]): string {
  for (const b of content) if (b.type === "text" && b.text != null) return b.text;
  return "";
}

const axisProps = Object.fromEntries(AXES.map((k) => [k, { type: "number" }]));

// ---- estimateFlavor ----
const estimateSchema = z.object({
  salt: z.number(),
  sweet: z.number(),
  sour: z.number(),
  bitter: z.number(),
  umami: z.number(),
  fat: z.number(),
  heat: z.number(),
  aromas: z.array(z.string()),
  texture: z.string(),
  temperature: z.string(),
  roles: z.array(z.string()),
  novelty: z.number(),
});

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface FlavorEstimate {
  model: string; // the model that answered — differs from the request on a fallback
  axes: AxisMap;
  aromas: string[];
  texture: Texture;
  temperature: Temperature;
  roles: Role[];
  novelty: number;
}

export async function estimateFlavor(
  name: string,
  categoryHint?: string,
  model: string = ESTIMATE_MODEL,
): Promise<FlavorEstimate> {
  const c = getClient();
  // The offline profile script passes Haiku, which takes no adaptive thinking,
  // effort, or fallbacks. Every other model gets all three; thinking counts
  // toward max_tokens, so leave room for it.
  const haiku = model.includes("haiku");
  const resp = await c.beta.messages.create({
    model,
    max_tokens: haiku ? 3000 : 16000,
    ...(haiku ? {} : { thinking: { type: "adaptive" }, betas: [FALLBACK_BETA], fallbacks: "default" }),
    system:
      "You estimate the profile of a single cooking ingredient for a recipe tool. " +
      "These are honest ESTIMATES, not measurements — a real version would draw on a tasting " +
      "panel or aroma-compound data. Provide:\n" +
      "- the 7 taste axes, each 0 to 1 (salt, sweet, sour, bitter, umami, fat=richness, heat)\n" +
      "- 2-3 short lowercase aroma tags\n" +
      "- the ingredient's primary texture, and the temperature it's usually served at " +
      "(use 'neutral' texture for liquids/powders/seasonings that add no textural contrast)\n" +
      "- 1-3 structural roles (the job it does in a dish) from this exact set: base, fat, acid, " +
      "salt, aromatic, heat, sweet, bitter, umami, texture, finish\n" +
      "- novelty 0 to 1: how off-script the ingredient is (0 = everyday/well-precedented like salt " +
      "or olive oil; ~0.5 = a little bold; 1 = unusual/experimental like soy-cured egg yolk).\n" +
      "Be calibrated: most ingredients are strong on only one or two axes.",
    messages: [
      {
        role: "user",
        content: `Estimate the profile of: ${name}` + (categoryHint ? ` (category: ${categoryHint})` : ""),
      },
    ],
    output_config: {
      ...(haiku ? {} : { effort: ESTIMATE_EFFORT }),
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            ...axisProps,
            aromas: { type: "array", items: { type: "string" } },
            texture: { type: "string", enum: TEXTURES },
            temperature: { type: "string", enum: TEMPERATURES },
            roles: { type: "array", items: { type: "string", enum: ROLES } },
            novelty: { type: "number" },
          },
          required: [...AXES, "aromas", "texture", "temperature", "roles", "novelty"],
          additionalProperties: false,
        },
      },
    },
  });
  // A refusal is an HTTP 200 with no usable content — check before parsing.
  if (resp.stop_reason === "refusal") throw new EstimateRefused(resp.stop_details?.category ?? null);
  const parsed = estimateSchema.parse(JSON.parse(firstText(resp.content)));
  const axes = { ...ZERO_AXES } as AxisMap;
  const raw = parsed as Record<string, unknown>;
  AXES.forEach((k) => {
    axes[k] = clamp01(Number(raw[k] ?? 0));
  });
  const aromas = parsed.aromas.map((a) => a.trim().toLowerCase()).filter(Boolean).slice(0, 3);
  const texture = (TEXTURES as string[]).includes(parsed.texture) ? (parsed.texture as Texture) : "neutral";
  const temperature = (TEMPERATURES as string[]).includes(parsed.temperature)
    ? (parsed.temperature as Temperature)
    : "room";
  const roles = parsed.roles.filter((r): r is Role => (ROLES as readonly string[]).includes(r));
  return {
    model: resp.model,
    axes,
    aromas,
    texture,
    temperature,
    roles: roles.length ? Array.from(new Set(roles)).slice(0, 3) : ["finish"],
    novelty: clamp01(parsed.novelty),
  };
}

// ---- suggestionWhy ----
const whySchema = z.object({
  reasons: z.array(z.object({ id: z.string(), why: z.string() })),
});

export interface WhyCandidate {
  id: string;
  name: string;
  roles: string[];
  shared?: string[]; // board aroma notes this candidate echoes
  contrast?: string; // a missing texture/temperature contrast it would add
  structure?: string; // a role the chosen direction leans on that it would fill
  partners?: string[]; // board ingredients it's a classic, established partner of
}

export async function suggestionWhy(
  board: { intentLabel: string; low: AxisMap; aromas?: string[] },
  candidates: WhyCandidate[],
): Promise<{ id: string; why: string }[]> {
  if (!candidates.length) return [];
  const c = getClient();
  const lowList = AXES.filter((k) => board.low[k] > 0.05)
    .sort((a, b) => board.low[b] - board.low[a])
    .map((k) => k)
    .join(", ");
  const boardAromas = (board.aromas ?? []).join(", ");
  const req: Anthropic.MessageCreateParamsNonStreaming = {
    model: WHY_MODEL,
    max_tokens: 1500,
    system:
      "You write a single, concrete one-line reason a suggested ingredient would help a dish — " +
      "a taste move (e.g. \"Lifts it with acid, and seasons it.\"), a pairing move when it echoes " +
      "aroma notes already on the board (e.g. \"Plays off the briny notes already there.\"), or a " +
      "texture move when it supplies a contrast the board is missing (e.g. \"Adds the crunch you're " +
      "missing.\"), a structural move when it fills a role the dish's direction leans on and the " +
      "board is missing (e.g. \"Brings the acid a pasta & sauce leans on.\"), or — strongest of all — " +
      "an established classic combination with something already on the board (e.g. \"A classic " +
      "partner for the tomato.\"); prefer this framing whenever classic-with is given. These are " +
      "heuristics — phrase as an offer, not a fact. Keep it under ~14 words, lowercase-after-first-" +
      "word, no emoji, end with a period.",
    messages: [
      {
        role: "user",
        content:
          `Intent: ${board.intentLabel}. The dish reads low on: ${lowList || "nothing in particular"}.\n` +
          `Aroma notes already on the board: ${boardAromas || "none yet"}.\n` +
          `For each candidate, give one reason it could play — lead with a shared aroma note or a missing contrast when it has one. Candidates:\n` +
          candidates
            .map(
              (x) =>
                `- ${x.id}: ${x.name} (roles: ${x.roles.join("/") || "—"}` +
                (x.partners && x.partners.length ? `; classic-with: ${x.partners.slice(0, 3).join(", ")}` : "") +
                (x.shared && x.shared.length ? `; shares: ${x.shared.join(", ")}` : "") +
                (x.contrast ? `; adds-contrast: ${x.contrast}` : "") +
                (x.structure ? `; fills-role: ${x.structure}` : "") +
                `)`,
            )
            .join("\n"),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            reasons: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "string" }, why: { type: "string" } },
                required: ["id", "why"],
                additionalProperties: false,
              },
            },
          },
          required: ["reasons"],
          additionalProperties: false,
        },
      },
    },
  };
  const resp = await c.messages.create(req);
  const parsed = whySchema.parse(JSON.parse(firstText(resp.content)));
  const valid = new Set(candidates.map((x) => x.id));
  return parsed.reasons.filter((r) => valid.has(r.id));
}
