// Mise — the deterministic engine. Ported verbatim from Mise.dc.html so the
// radar, flags, and suggestion ranking are byte-for-byte the prototype's final
// (flavor-only) behavior. Runs client-side for instant, live recompute.
//
// Structural ("Structure") flags and the form role-fill suggestion boost were
// deliberately removed in the design chat — this engine is flavor-driven only.

import {
  AXES,
  AXIS_NAME,
  MAG_W,
  ROLE_LABEL,
  TEXTURE_FAMILY,
  VERB,
  ZERO_AXES,
  type Axis,
  type AxisMap,
  type Form,
  type Intent,
  type Magnitude,
  type Role,
  type Temperature,
  type Texture,
  type TextureFamily,
} from "./domain";
import type { CommittedRow, Flag, Ingredient, Suggestion } from "./types";

export type ById = (id: string) => Ingredient | undefined;

export function weight(m: Magnitude): number {
  return MAG_W[m] != null ? MAG_W[m] : 1;
}

export function rowAxes(c: CommittedRow, byId: ById): AxisMap {
  if (c.axes != null) return c.axes;
  const ing = byId(c.ingredientId);
  return ing && ing.axes ? ing.axes : { ...ZERO_AXES };
}

export function rowAromas(c: CommittedRow, byId: ById): string[] {
  if (c.aromas != null) return c.aromas;
  const ing = byId(c.ingredientId);
  return ing && ing.aromas ? ing.aromas : [];
}

export function rowReflected(c: CommittedRow, byId: ById): boolean {
  const ax = rowAxes(c, byId);
  return AXES.some((k) => (ax[k] || 0) > 0);
}

// The board's pooled aroma profile: each tag weighted by the magnitude of the
// ingredients carrying it. Used for the aroma summary and for suggestion affinity.
export function boardAromaWeights(committed: CommittedRow[], byId: ById): Map<string, number> {
  const w = new Map<string, number>();
  committed.forEach((c) => {
    const mw = weight(c.magnitude);
    rowAromas(c, byId).forEach((a) => {
      const t = a.trim().toLowerCase();
      if (!t) return;
      w.set(t, (w.get(t) || 0) + mw);
    });
  });
  return w;
}

// ---- texture / temperature (P1) ----
export function rowTexture(c: CommittedRow, byId: ById): Texture {
  if (c.texture != null) return c.texture;
  return byId(c.ingredientId)?.texture ?? "neutral";
}

export function rowTemperature(c: CommittedRow, byId: ById): Temperature {
  if (c.temperature != null) return c.temperature;
  return byId(c.ingredientId)?.temperature ?? "room";
}

// Texture families present on the board (neutral excluded — seasonings/liquids
// add no textural contrast).
export function textureFamilies(committed: CommittedRow[], byId: ById): Set<TextureFamily> {
  const fams = new Set<TextureFamily>();
  committed.forEach((c) => {
    const fam = TEXTURE_FAMILY[rowTexture(c, byId)];
    if (fam !== "neutral") fams.add(fam);
  });
  return fams;
}

export function temperatures(committed: CommittedRow[], byId: ById): Set<Temperature> {
  const temps = new Set<Temperature>();
  committed.forEach((c) => temps.add(rowTemperature(c, byId)));
  return temps;
}

// Quiet, reflective observations about contrast — never a score. Only speaks up
// once there are at least two ingredients to compare, and caps at two cues.
export function contrastCues(committed: CommittedRow[], byId: ById): string[] {
  if (committed.length < 2) return [];
  const fams = textureFamilies(committed, byId);
  const temps = temperatures(committed, byId);
  const cues: string[] = [];

  const hasCrunch = fams.has("crunch");
  const hasSoft = fams.has("soft");
  if (hasSoft && !hasCrunch) cues.push("All soft — no crunch yet.");
  else if (hasCrunch && !hasSoft) cues.push("Lots of crunch, nothing soft to land on.");

  const hasFresh = fams.has("fresh");
  const hasCold = temps.has("cold");
  if (!hasFresh && !hasCold) cues.push("Nothing cool or fresh on the board.");

  return cues.slice(0, 2);
}

// The contrasts the board is missing — the actionable form of contrastCues, used
// to nudge suggestions toward ingredients that would supply them.
export interface ContrastNeeds {
  crunch: boolean;
  soft: boolean;
  cool: boolean;
}
export function contrastNeeds(committed: CommittedRow[], byId: ById): ContrastNeeds {
  if (committed.length < 2) return { crunch: false, soft: false, cool: false };
  const fams = textureFamilies(committed, byId);
  const temps = temperatures(committed, byId);
  const hasCrunch = fams.has("crunch");
  const hasSoft = fams.has("soft");
  const hasFresh = fams.has("fresh");
  const hasCold = temps.has("cold");
  return {
    crunch: hasSoft && !hasCrunch,
    soft: hasCrunch && !hasSoft,
    cool: !hasFresh && !hasCold,
  };
}

export function axisSums(committed: CommittedRow[], byId: ById): AxisMap {
  const s: AxisMap = { ...ZERO_AXES };
  committed.forEach((c) => {
    const ax = rowAxes(c, byId);
    const w = weight(c.magnitude);
    AXES.forEach((k) => {
      s[k] += (ax[k] || 0) * w;
    });
  });
  return s;
}

// Saturating aggregation: contributions show diminishing returns.
export function axisDisplay(committed: CommittedRow[], byId: ById): AxisMap {
  const s = axisSums(committed, byId);
  const d: AxisMap = { ...ZERO_AXES };
  AXES.forEach((k) => {
    d[k] = 1 - Math.exp(-0.6 * s[k]);
  });
  return d;
}

export function desiredVec(intent: Intent): AxisMap {
  const d: AxisMap = { ...ZERO_AXES };
  AXES.forEach((k) => {
    d[k] = intent.targets[k] != null ? (intent.targets[k] as number) : 0.35;
  });
  return d;
}

// How far below the intent each axis sits — the gap the suggestions chase.
// Explicit intent targets always count. The soft 0.35 baseline for axes the
// intent doesn't name fades as the board develops: an empty/sparse board still
// gets "round it out" breadth, but once a dish has a clear character (≈5
// ingredients in) the engine serves THAT aim instead of chasing a generic "bit
// of everything" — which used to pull a saturated savory dish toward
// off-character bitter/sour and surface things like matcha or cocoa.
export function intentGap(committed: CommittedRow[], byId: ById, intent: Intent): AxisMap {
  const disp = axisDisplay(committed, byId);
  const n = committed.length;
  const fade = n <= 2 ? 1 : Math.max(0, 1 - (n - 2) / 3);
  const low: AxisMap = { ...ZERO_AXES };
  AXES.forEach((k) => {
    const target = intent.targets[k] != null ? (intent.targets[k] as number) : 0.35 * fade;
    low[k] = Math.max(0, target - disp[k]);
  });
  return low;
}

export function buildFlags(
  disp: AxisMap,
  intent: Intent,
  dismissed: string[],
): Flag[] {
  const out: Flag[] = [];
  const t = intent.targets;
  (Object.keys(t) as Axis[]).forEach((ax) => {
    const tv = t[ax] as number;
    const cur = disp[ax];
    if (tv >= 0.5 && cur < tv - 0.2) {
      out.push({
        id: intent.id + "-" + ax + "-low",
        kind: "intent",
        text:
          "You’re going for “" +
          intent.label +
          "” — " +
          AXIS_NAME[ax] +
          " is reading low. Want something to nudge it up?",
      });
    } else if (tv <= 0.25 && cur > 0.5) {
      out.push({
        id: intent.id + "-" + ax + "-high",
        kind: "intent",
        text:
          "You said “" +
          intent.label +
          ",” but it’s reading heavy on " +
          AXIS_NAME[ax] +
          ". A bright contrast could cut through.",
      });
    }
  });
  return out.filter((f) => !dismissed.includes(f.id)).slice(0, 2);
}

// Intrinsic-balance flags (P2): tensions a cook would notice regardless of their
// intent (Nosrat's corrections). High-precision, quiet, dismissible. Reads the
// saturated displayed axes. Only speaks up with 2+ ingredients; caps at two.
const INTRINSIC = {
  fatHigh: 0.6,
  acidLow: 0.25,
  sweetHigh: 0.6,
  saltLow: 0.25,
  bitterHigh: 0.55,
  sweetLow: 0.25,
  fatLow: 0.3,
};

export function buildIntrinsicFlags(
  disp: AxisMap,
  dismissed: string[],
  ingredientCount: number,
): Flag[] {
  if (ingredientCount < 2) return [];
  const out: Flag[] = [];

  if (disp.fat > INTRINSIC.fatHigh && disp.sour < INTRINSIC.acidLow) {
    out.push({
      id: "intrinsic-rich-no-acid",
      kind: "intrinsic",
      text: "Reading rich, with little acid to cut it — a sharp note could lift it.",
    });
  }
  if (
    disp.sweet > INTRINSIC.sweetHigh &&
    disp.sour < INTRINSIC.acidLow &&
    disp.salt < INTRINSIC.saltLow
  ) {
    out.push({
      id: "intrinsic-sweet-flat",
      kind: "intrinsic",
      text: "Sweet-forward, with little salt or acid to balance it.",
    });
  }
  if (
    disp.bitter > INTRINSIC.bitterHigh &&
    disp.sweet < INTRINSIC.sweetLow &&
    disp.fat < INTRINSIC.fatLow
  ) {
    out.push({
      id: "intrinsic-bitter-sharp",
      kind: "intrinsic",
      text: "A bitter edge with little sweetness or richness to soften it.",
    });
  }

  return out.filter((f) => !dismissed.includes(f.id)).slice(0, 2);
}

// Local "why" phrasing — the fallback when the Claude call is slow/unavailable.
// `shared` are the board aroma tags this candidate echoes; when affinity is the
// reason it's surfacing, lead with that pairing rather than a flavor-gap move.
export function buildWhy(
  ing: Ingredient,
  low: AxisMap,
  shared: string[] = [],
  affinityLed = false,
): string {
  const sharedTxt = shared.slice(0, 2).join(", ");
  const pairing = () => "Plays off the " + sharedTxt + " notes already on the board.";

  if (affinityLed && sharedTxt) return pairing();

  const contrib = AXES.map((k) => ({ k, v: (ing.axes[k] || 0) * (low[k] || 0) })).sort(
    (a, b) => b.v - a.v,
  );
  if (contrib[0].v < 0.03) {
    if (sharedTxt) return pairing();
    return (
      "A wildcard — " +
      ing.aromas[0] +
      " and " +
      (ing.aromas[1] || ing.aromas[0]) +
      " notes to play against the dish."
    );
  }
  const v0 = VERB[contrib[0].k];
  let txt = v0.charAt(0).toUpperCase() + v0.slice(1);
  if (contrib[1] && contrib[1].v > 0.05) txt += ", and " + VERB[contrib[1].k];
  return txt + ".";
}

export function riskMeta(nov: number): { text: string; color: string } {
  if (nov < 0.34) return { text: "safe bet", color: "#8a8170" };
  if (nov < 0.67) return { text: "a little bold", color: "#b58a3b" };
  return { text: "off-script", color: "#b5481f" };
}

// Blend weights for the suggestion score (sum ~1). Flavor-gap stays primary (the
// radar/intent is the spine); aroma-affinity, texture-contrast, and structure reshuffle.
const W_FILL = 0.5;
const W_AFFINITY = 0.25;
const W_CONTRAST = 0.12;
const W_STRUCTURE = 0.13;
// A lean role with less than this magnitude-weight committed is "open" (≈ less than
// a single supporting ingredient). Keeps the structure signal board-specific, not
// the loose role-checklist truism it once was.
const ROLE_OPEN_THRESHOLD = 0.5;
// base/fat are foundational — the cook starts with them, so "a pasta leans on body"
// is a truism. The structure nudge only speaks to the characterful, completing roles.
const GENERIC_ROLES = new Set<Role>(["base", "fat"]);

const CONTRAST_NOTE = {
  crunch: "Adds the crunch you're missing.",
  soft: "Adds something soft to land on.",
  cool: "Brings something cool and fresh.",
};

export interface SuggestionInput {
  committed: CommittedRow[];
  byId: ById;
  pool: Ingredient[]; // candidate ingredients (e.g. the pantry), full objects
  intent: Intent;
  risk: number;
  suggestionCount: number;
  activeCompName: string;
  form?: Form | null; // the chosen direction; biases toward roles it leans on
}

// Flavor-gap ranking against the intent + risk-dial novelty match, guaranteeing
// at least one off-script pick. Returns ranked candidates with a local "why".
export function getSuggestions(input: SuggestionInput): Suggestion[] {
  const { committed, byId, pool: rawPool, intent, risk, suggestionCount, activeCompName, form = null } = input;
  const disp = axisDisplay(committed, byId);
  const low = intentGap(committed, byId, intent);
  // How much gap is actually left to chase. Fill is normalized (best candidate → 1),
  // which would turn even a 0.03 sliver into a full-strength signal — so a barely-unmet
  // dish would still chase that axis hard (e.g. pile on oils to "finish" the fat). Scale
  // the fill spine by the real gap size: as the aim is met, fill fades and ranking leans
  // on reinforcing the dish's character + contrast instead.
  const GAP_REF = 0.6;
  const totalGap = AXES.reduce((s, k) => s + low[k], 0);
  const gapStrength = Math.min(1, totalGap / GAP_REF);
  // Reinforcement (strength on the intent's named axes) and off-aim push (raising
  // an axis already past what the aim wants). Becomes the ranking spine as the flavor
  // gap fades — so an on-aim dish gets coherent "deepen the character" picks.
  const tgt = intent.targets;
  const reinforceOf = (ing: Ingredient) =>
    AXES.reduce((sum, k) => sum + (ing.axes[k] || 0) * (tgt[k] != null ? (tgt[k] as number) : 0), 0);
  const offAimOf = (ing: Ingredient) =>
    AXES.reduce((sum, k) => {
      const want = tgt[k] != null ? (tgt[k] as number) : 0;
      return sum + (ing.axes[k] || 0) * Math.max(0, disp[k] - want);
    }, 0);
  const committedIds = committed.map((c) => c.ingredientId);
  const pool = rawPool.filter((p) => !committedIds.includes(p.id));

  // Affinity: aroma-tag overlap with the board, IDF-weighted by tag rarity in the pool
  // so a shared distinctive note (briny, fermented) counts more than a hub note (earthy).
  const boardTags = boardAromaWeights(committed, byId);
  const N = Math.max(1, pool.length);
  const df = new Map<string, number>();
  pool.forEach((p) => {
    new Set(p.aromas.map((a) => a.toLowerCase())).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  });
  const idf = (t: string) => Math.log(1 + N / (df.get(t) || 1));

  // Texture/temperature contrast the board is missing — nudge toward filling it.
  const needs = contrastNeeds(committed, byId);

  // Structure: which roles the chosen direction leans on are still "open" on the
  // board (≈ nothing substantial doing that job). A candidate whose own job is an
  // open lean role gets nudged. Specific to the board, not a blanket checklist.
  const roleFilled = new Map<Role, number>();
  committed.forEach((c) => roleFilled.set(c.role, (roleFilled.get(c.role) || 0) + weight(c.magnitude)));
  const leanSet = form ? new Set<Role>(form.leanRoles) : new Set<Role>();
  const isOpenLean = (r: Role) =>
    !!form && leanSet.has(r) && !GENERIC_ROLES.has(r) && (roleFilled.get(r) || 0) < ROLE_OPEN_THRESHOLD;

  const raw = pool.map((ing) => {
    let fill = 0;
    AXES.forEach((k) => {
      fill += (ing.axes[k] || 0) * low[k];
    });
    const shared: string[] = [];
    let aff = 0;
    ing.aromas.forEach((a) => {
      const bw = boardTags.get(a.toLowerCase());
      if (bw) {
        shared.push(a);
        aff += bw * idf(a.toLowerCase());
      }
    });
    const fam = TEXTURE_FAMILY[ing.texture];
    let con = 0;
    let contrast = "";
    if (needs.crunch && fam === "crunch") {
      con += 1;
      contrast = CONTRAST_NOTE.crunch;
    }
    if (needs.soft && fam === "soft") {
      con += 1;
      if (!contrast) contrast = CONTRAST_NOTE.soft;
    }
    if (needs.cool && (ing.temperature === "cold" || fam === "fresh")) {
      con += 1;
      if (!contrast) contrast = CONTRAST_NOTE.cool;
    }
    let structure = 0;
    let structureNote = "";
    // Primary-role fit: this ingredient's main job IS a role the direction leans on
    // and the board is missing. That's when the structural framing is worth leading with.
    const structurePrimary = !!(form && ing.roles[0] && isOpenLean(ing.roles[0]));
    if (form) {
      const note = (r: Role) => `Brings the ${ROLE_LABEL[r]} a ${form.label.toLowerCase()} leans on.`;
      if (structurePrimary) {
        structure += 1;
        structureNote = note(ing.roles[0]);
      }
      ing.roles.slice(1).forEach((r) => {
        if (isOpenLean(r)) {
          structure += 0.4;
          if (!structureNote) structureNote = note(r);
        }
      });
    }
    const aligned = Math.max(0, reinforceOf(ing) - offAimOf(ing));
    return { ing, fill, aff, con, structure, structurePrimary, shared, contrast, structureNote, aligned, riskMatch: 1 - Math.abs(ing.novelty - risk) };
  });

  // Normalize each signal across the candidate set so affinity and contrast genuinely
  // compete with gap-fill (an un-normalized bonus would be swamped by fill, as before).
  const maxFill = raw.reduce((m, s) => Math.max(m, s.fill), 0);
  const maxAff = raw.reduce((m, s) => Math.max(m, s.aff), 0);
  const maxCon = raw.reduce((m, s) => Math.max(m, s.con), 0);
  const maxStruct = raw.reduce((m, s) => Math.max(m, s.structure), 0);
  const maxAligned = raw.reduce((m, s) => Math.max(m, s.aligned), 0);
  // The spine blends gap-fill → alignment as the intent is met: a wide-open board
  // chases the flavor gap; an on-aim board reinforces its character instead of
  // hammering a near-closed axis.
  const scored = raw.map((s) => {
    const spineFill = maxFill > 0 ? s.fill / maxFill : 0;
    const spineAlign = maxAligned > 0 ? s.aligned / maxAligned : 0;
    const fillN = gapStrength * spineFill + (1 - gapStrength) * spineAlign;
    const affN = maxAff > 0 ? s.aff / maxAff : 0;
    const conN = maxCon > 0 ? s.con / maxCon : 0;
    const structN = maxStruct > 0 ? s.structure / maxStruct : 0;
    const base = W_FILL * fillN + W_AFFINITY * affN + W_CONTRAST * conN + W_STRUCTURE * structN;
    return { ...s, fillN, affN, conN, structN, score: base * (0.45 + 0.55 * s.riskMatch) };
  });

  // A candidate earns a slot by filling a flavor gap, reinforcing the character,
  // pairing, adding a missing contrast, or doing a structural job the direction leans on.
  const useful = scored
    .filter((s) => s.fill > 0.02 || (gapStrength < 1 && s.aligned > 0) || s.aff > 0 || s.con > 0 || s.structure > 0)
    .sort((a, b) => b.score - a.score);
  const count = Math.max(3, Math.min(suggestionCount, pool.length));

  // Diversity: don't let one "move" flood the list. Group candidates by their
  // dominant axis (oils → fat, vinegars → sour, …) and take at most a couple per
  // group before moving on, so the cook sees a range of ideas (a fat, an acid, a
  // fresh thing, an umami hit) instead of eight interchangeable oils. The cap
  // relaxes only if there aren't enough distinct groups to fill the list.
  const FAMILY_CAP = Math.max(2, Math.ceil(count / 4));
  const famOf = (ing: Ingredient): Axis => {
    let best: Axis = AXES[0];
    let bv = -Infinity;
    AXES.forEach((k) => {
      const v = ing.axes[k] || 0;
      if (v > bv) {
        bv = v;
        best = k;
      }
    });
    return best;
  };
  const famCount = new Map<Axis, number>();
  const sel: typeof useful = [];
  for (const s of useful) {
    if (sel.length >= count) break;
    const fam = famOf(s.ing);
    if ((famCount.get(fam) || 0) >= FAMILY_CAP) continue;
    sel.push(s);
    famCount.set(fam, (famCount.get(fam) || 0) + 1);
  }
  // Top up by score if the diversity cap left us short of the requested count.
  if (sel.length < count) {
    for (const s of useful) {
      if (sel.length >= count) break;
      if (!sel.includes(s)) sel.push(s);
    }
  }

  // Always include at least one off-script (high-novelty) pick — the best-scoring
  // one, so even the bold pick stays coherent with the board (not an arbitrary
  // high-novelty item when there's no flavor gap to rank by).
  if (!sel.some((s) => s.ing.novelty >= 0.6)) {
    const off = scored
      .filter((s) => s.ing.novelty >= 0.6)
      .sort((a, b) => b.score - a.score)[0];
    if (off) {
      if (sel.length >= count) sel[sel.length - 1] = off;
      else sel.push(off);
    }
  }
  // Surface the direction: ensure a pick that will actually read as structural (its
  // primary job is a role the direction leans on and the board lacks, and it isn't
  // overridden by a contrast lead) is present — so the chosen direction visibly
  // contributes a "here's the acid/finish your pasta wants" idea.
  const showsStructure = (s: (typeof scored)[number]) => s.structurePrimary && s.con === 0;
  if (form && !sel.some(showsStructure)) {
    const best = scored.filter(showsStructure).sort((a, b) => b.score - a.score)[0];
    if (best) {
      if (sel.length >= count) sel[sel.length - 1] = best;
      else sel.push(best);
    }
  }
  if (sel.length < count) {
    const extra = scored
      .filter((s) => sel.indexOf(s) === -1)
      .sort((a, b) => b.score - a.score);
    while (sel.length < count && extra.length) sel.push(extra.shift()!);
  }

  // Cap how many cards lead with a structural "why", and dedupe the role, so the
  // direction stays a couple of pointed nudges instead of a repeated chant.
  const usedStructNotes = new Set<string>();
  let structLeads = 0;
  return sel.map((s) => {
    const meta = riskMeta(s.ing.novelty);
    const contrastLed = s.conN > 0 && s.conN >= s.fillN && s.conN >= s.affN;
    let structureLed = false;
    if (!contrastLed && s.structurePrimary && structLeads < 2 && !usedStructNotes.has(s.structureNote)) {
      structureLed = true;
      usedStructNotes.add(s.structureNote);
      structLeads++;
    }
    const affinityLed = !contrastLed && !structureLed && s.affN > s.fillN && s.shared.length > 0;
    let why: string;
    if (contrastLed) why = s.contrast;
    else if (structureLed) why = s.structureNote;
    else why = buildWhy(s.ing, low, s.shared, affinityLed);
    return {
      id: s.ing.id,
      name: s.ing.name,
      roleFill: (ROLE_LABEL[s.ing.roles[0]] || s.ing.roles[0] || "").toUpperCase(),
      why,
      riskText: meta.text,
      riskColor: meta.color,
      targetLabel: activeCompName,
      shared: s.shared,
      contrast: s.contrast,
      structure: s.structureNote,
    };
  });
}

export function riskDialLabel(r: number): string {
  if (r < 0.15) return "play it safe";
  if (r < 0.35) return "cautious";
  if (r < 0.55) return "balanced";
  if (r < 0.78) return "adventurous";
  return "push it";
}
