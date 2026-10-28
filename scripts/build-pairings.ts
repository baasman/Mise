// Build the classic-pairings graph over the pantry's own vocabulary.
//
// For each pantry ingredient, ask Claude (Haiku) to select its established,
// canonical companions — Flavor-Bible-style culinary tradition, NOT invented
// combinations — strictly from the pantry's own name list (so there is no
// name-mapping problem). Two tiers: "classic" (bold, canonical) and "good"
// (well-precedented). Written to prisma/pairings.json, committed to the repo,
// and loaded deterministically at runtime — no API calls when suggesting.
//
// Idempotent + resumable: targets already in the file are skipped; the file is
// rewritten after every completed batch, so an interrupted run just resumes.
//
// Run:  npx tsx scripts/build-pairings.ts          (all pantry ingredients)
//       npx tsx scripts/build-pairings.ts 8        (first 8 missing — dry run)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

// tsx doesn't auto-load .env — pull ANTHROPIC_API_KEY in by hand.
function loadEnv() {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, "");
      if (!(key in process.env) || !process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env — rely on the ambient environment */
  }
}
loadEnv();

const prisma = new PrismaClient();
const MODEL = process.env.MISE_PAIRING_MODEL || "claude-haiku-4-5";
const OUT = "prisma/pairings.json";
const TARGETS_PER_CALL = 4;
const CONCURRENCY = 4;

// Strengths for the two tiers (engine treats these as edge weights).
const S_CLASSIC = 1.0;
const S_GOOD = 0.6;

// Pace request starts under the org's per-minute limit (Haiku tier ~50 rpm).
const RPM = parseInt(process.env.MISE_PAIRING_RPM || "40", 10);
const SPACING_MS = Math.ceil(60000 / RPM);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let nextSlot = Date.now();
async function acquireSlot() {
  const now = Date.now();
  const start = Math.max(now, nextSlot);
  nextSlot = start + SPACING_MS;
  const wait = start - now;
  if (wait > 0) await sleep(wait);
}

// pairings.json shape: { [targetSlug]: [ [companionSlug, strength], ... ] }
type PairFile = Record<string, [string, number][]>;

function firstText(content: Anthropic.Messages.ContentBlock[]): string {
  for (const b of content) if (b.type === "text") return b.text;
  return "";
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set (looked in .env and the environment). Aborting.");
    process.exit(1);
  }
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;

  const rows = await prisma.ingredient.findMany({
    where: { deviceId: null },
    select: { slug: true, name: true },
    orderBy: { slug: "asc" },
  });
  const nameToSlug = new Map(rows.map((r) => [r.name.toLowerCase(), r.slug]));
  const nameList = rows.map((r) => r.name);

  const file: PairFile = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const todo = rows.filter((r) => !(r.slug in file)).slice(0, limit);
  console.log(`Pantry: ${rows.length} · already paired: ${Object.keys(file).length} · to pair now: ${todo.length}`);
  if (!todo.length) {
    console.log("Nothing to do.");
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const batches: (typeof todo)[] = [];
  for (let i = 0; i < todo.length; i += TARGETS_PER_CALL) batches.push(todo.slice(i, i + TARGETS_PER_CALL));

  const system =
    "You are a culinary reference. For each TARGET ingredient, select its established " +
    "companion ingredients — combinations with real precedent in cooking traditions and " +
    "reference works (the Flavor Bible sense), NOT novel inventions.\n" +
    "Rules:\n" +
    "- Choose ONLY from the provided ingredient list, copying names EXACTLY as written.\n" +
    "- 'classic': 4-8 canonical partners (the bold entries — tomato & basil, lamb & rosemary).\n" +
    "- 'good': 4-8 more that are well-precedented but less iconic.\n" +
    "- Do not include the target itself. Quality over quantity: omit weak matches.";

  let done = 0;
  let written = 0;
  let dropped = 0;
  const failures: string[] = [];

  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
      while (i < batches.length) {
        const batch = batches[i++];
        try {
          await acquireSlot();
          const req: Anthropic.MessageCreateParamsNonStreaming = {
            model: MODEL,
            max_tokens: 3000,
            system,
            messages: [
              {
                role: "user" as const,
                content:
                  `Ingredient list (choose companions ONLY from these, verbatim):\n${nameList.join("; ")}\n\n` +
                  `TARGETS: ${batch.map((b) => b.name).join(" | ")}`,
              },
            ],
            output_config: {
              format: {
                type: "json_schema",
                schema: {
                  type: "object",
                  properties: {
                    pairings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          target: { type: "string" },
                          classic: { type: "array", items: { type: "string" } },
                          good: { type: "array", items: { type: "string" } },
                        },
                        required: ["target", "classic", "good"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["pairings"],
                  additionalProperties: false,
                },
              },
            },
          };
          const resp = await client.messages.create(req);
          const parsed = JSON.parse(firstText(resp.content)) as {
            pairings: { target: string; classic: string[]; good: string[] }[];
          };
          for (const p of parsed.pairings) {
            const targetSlug = nameToSlug.get(p.target.toLowerCase());
            if (!targetSlug || !batch.some((b) => b.slug === targetSlug)) continue;
            const edges: [string, number][] = [];
            const seen = new Set<string>([targetSlug]);
            const take = (names: string[], strength: number, cap: number) => {
              for (const n of names.slice(0, cap)) {
                const s = nameToSlug.get(n.trim().toLowerCase());
                if (!s) {
                  dropped++;
                  continue;
                }
                if (seen.has(s)) continue;
                seen.add(s);
                edges.push([s, strength]);
              }
            };
            take(p.classic, S_CLASSIC, 8);
            take(p.good, S_GOOD, 8);
            file[targetSlug] = edges;
            written++;
          }
          // Any batch member the model skipped: mark empty so we don't loop forever;
          // delete-and-rerun the key later to retry it.
          for (const b of batch) if (!(b.slug in file)) file[b.slug] = [];
          writeFileSync(OUT, JSON.stringify(file));
        } catch (e) {
          failures.push(batch.map((b) => b.name).join(", "));
          console.warn(`  ✗ batch [${batch.map((b) => b.name).join(", ")}]: ${e instanceof Error ? e.message : e}`);
        } finally {
          done++;
          if (done % 5 === 0 || done === batches.length) {
            console.log(`  …batch ${done}/${batches.length} (targets written ${written}, hallucinated names dropped ${dropped})`);
          }
        }
      }
    }),
  );

  const total = Object.keys(file).length;
  const edgeCount = Object.values(file).reduce((s, e) => s + e.length, 0);
  console.log(`\nDone. ${total} targets in ${OUT}, ${edgeCount} directed edges. Dropped ${dropped} non-list names.`);
  if (failures.length) console.log(`Failed batches (re-run to retry): ${failures.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
