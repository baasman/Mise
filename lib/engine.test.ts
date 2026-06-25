import { describe, expect, it } from "vitest";
import { PANTRY, INTENTS, FORMS, ZERO_AXES, type AxisMap, type Role, type Temperature, type Texture } from "./domain";
import {
  axisDisplay,
  boardAromaWeights,
  buildFlags,
  buildIntrinsicFlags,
  buildWhy,
  contrastCues,
  getSuggestions,
  riskDialLabel,
  textureFamilies,
  type ById,
} from "./engine";
import type { Magnitude } from "./domain";
import type { CommittedRow, Ingredient } from "./types";

const byId: ById = (id) => PANTRY.find((p) => p.id === id) as Ingredient | undefined;

// The prototype's seeded "Sunday plate".
const seedCommitted: CommittedRow[] = [
  { uid: 1, ingredientId: "olive_oil", magnitude: "supporting", role: "base", componentId: "c1" },
  { uid: 2, ingredientId: "roasted_tomato", magnitude: "dominant", role: "base", componentId: "c1" },
  { uid: 3, ingredientId: "sherry_vinegar", magnitude: "trace", role: "acid", componentId: "c2" },
];

describe("axisDisplay (1 - e^(-0.6*sum))", () => {
  it("saturates and stays within 0..1", () => {
    const d = axisDisplay(seedCommitted, byId);
    for (const v of Object.values(d)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("matches the hand-computed umami value for the seed dish", () => {
    // umami sum = olive_oil .10*1 + roasted_tomato .60*2 + sherry_vinegar .05*.3
    // = 0.10 + 1.20 + 0.015 = 1.315 -> 1 - e^(-0.6*1.315)
    const expected = 1 - Math.exp(-0.6 * 1.315);
    expect(axisDisplay(seedCommitted, byId).umami).toBeCloseTo(expected, 6);
  });

  it("a slider override moving umami up raises the displayed umami", () => {
    const base = axisDisplay(seedCommitted, byId).umami;
    const bumped: CommittedRow[] = seedCommitted.map((c) =>
      c.uid === 2
        ? { ...c, axes: { ...PANTRY.find((p) => p.id === "roasted_tomato")!.axes, umami: 0.9 } }
        : c,
    );
    expect(axisDisplay(bumped, byId).umami).toBeGreaterThan(base);
  });
});

describe("getSuggestions", () => {
  const intent = INTENTS.find((i) => i.id === "bright_sharp")!;

  it("returns the requested count and never re-suggests committed ingredients", () => {
    const sugg = getSuggestions({
      committed: seedCommitted,
      byId,
      pool: PANTRY as Ingredient[],
      intent,
      risk: 0.3,
      suggestionCount: 7,
      activeCompName: "The sauce",
    });
    expect(sugg.length).toBe(7);
    const ids = sugg.map((s) => s.id);
    expect(ids).not.toContain("olive_oil");
    expect(ids).not.toContain("roasted_tomato");
    expect(ids).not.toContain("sherry_vinegar");
  });

  it("always includes at least one off-script (novelty >= 0.6) pick", () => {
    const sugg = getSuggestions({
      committed: seedCommitted,
      byId,
      pool: PANTRY as Ingredient[],
      intent,
      risk: 0.1,
      suggestionCount: 4,
      activeCompName: "The sauce",
    });
    const hasOffScript = sugg.some((s) => {
      const ing = PANTRY.find((p) => p.id === s.id)!;
      return ing.novelty >= 0.6;
    });
    expect(hasOffScript).toBe(true);
  });
});

describe("buildFlags", () => {
  it("produces intent-only observations, max two, respecting dismissals", () => {
    const intent = INTENTS.find((i) => i.id === "rich_comforting")!;
    const empty = axisDisplay([], byId); // nothing on the board -> low everywhere
    const flags = buildFlags(empty, intent, []);
    expect(flags.length).toBeLessThanOrEqual(2);
    flags.forEach((f) => expect(f.kind).toBe("intent"));
    if (flags.length) {
      const dismissed = buildFlags(empty, intent, [flags[0].id]);
      expect(dismissed.map((f) => f.id)).not.toContain(flags[0].id);
    }
  });
});

describe("riskDialLabel", () => {
  it("maps the dial to the prototype's words", () => {
    expect(riskDialLabel(0.1)).toBe("play it safe");
    expect(riskDialLabel(0.3)).toBe("cautious");
    expect(riskDialLabel(0.5)).toBe("balanced");
    expect(riskDialLabel(0.7)).toBe("adventurous");
    expect(riskDialLabel(0.9)).toBe("push it");
  });
});

function row(uid: number, ingredientId: string, magnitude: Magnitude = "supporting"): CommittedRow {
  return { uid, ingredientId, magnitude, role: "base", componentId: "c1" };
}

describe("buildIntrinsicFlags (P2)", () => {
  it("fires rich-no-acid for a fat-heavy board with no acid", () => {
    const board = [row(1, "tahini", "dominant"), row(2, "olive_oil")];
    const flags = buildIntrinsicFlags(axisDisplay(board, byId), [], board.length);
    expect(flags.map((f) => f.id)).toContain("intrinsic-rich-no-acid");
    flags.forEach((f) => expect(f.kind).toBe("intrinsic"));
  });

  it("clears rich-no-acid once acid is added", () => {
    const board = [row(1, "tahini", "dominant"), row(2, "olive_oil"), row(3, "sherry_vinegar", "dominant")];
    const flags = buildIntrinsicFlags(axisDisplay(board, byId), [], board.length);
    expect(flags.map((f) => f.id)).not.toContain("intrinsic-rich-no-acid");
  });

  it("stays silent with fewer than two ingredients", () => {
    const board = [row(1, "tahini", "dominant")];
    expect(buildIntrinsicFlags(axisDisplay(board, byId), [], board.length)).toHaveLength(0);
  });

  it("respects dismissals", () => {
    const board = [row(1, "tahini", "dominant"), row(2, "olive_oil")];
    const flags = buildIntrinsicFlags(axisDisplay(board, byId), ["intrinsic-rich-no-acid"], board.length);
    expect(flags.map((f) => f.id)).not.toContain("intrinsic-rich-no-acid");
  });
});

describe("contrast (P1)", () => {
  it("detects the texture families on the board", () => {
    const board = [row(1, "yogurt"), row(2, "walnut")]; // creamy=soft, crunchy=crunch
    const fams = textureFamilies(board, byId);
    expect(fams.has("soft")).toBe(true);
    expect(fams.has("crunch")).toBe(true);
  });

  it("flags an all-soft board and clears it once crunch arrives", () => {
    const soft = [row(1, "yogurt"), row(2, "egg_yolk")]; // both creamy + cold
    expect(contrastCues(soft, byId)).toContain("All soft — no crunch yet.");
    const withCrunch = [...soft, row(3, "walnut")];
    expect(contrastCues(withCrunch, byId)).not.toContain("All soft — no crunch yet.");
  });

  it("stays silent with a single ingredient", () => {
    expect(contrastCues([row(1, "yogurt")], byId)).toHaveLength(0);
  });
});

// ---- P4: affinity-aware suggestions ----
function ing(
  id: string,
  ax: Partial<AxisMap>,
  aromas: string[],
  novelty = 0.3,
  texture: Texture = "neutral",
  temperature: Temperature = "room",
  roles: Role[] = ["umami"],
): Ingredient {
  return {
    id,
    name: id,
    roles,
    aromas,
    novelty,
    axes: { ...ZERO_AXES, ...ax },
    texture,
    temperature,
  };
}
const poolById =
  (pool: Ingredient[]): ById =>
  (id) =>
    pool.find((p) => p.id === id);
const richIntent = INTENTS.find((i) => i.id === "rich_comforting")!;

describe("boardAromaWeights", () => {
  it("pools tags weighted by magnitude", () => {
    const w = boardAromaWeights(
      [row(1, "anchovy", "supporting"), row(2, "capers", "supporting")],
      byId,
    ); // anchovy: briny/savory · capers: briny/floral
    expect(w.get("briny")).toBe(2);
    expect(w.get("savory")).toBe(1);
    expect(w.get("floral")).toBe(1);
  });
});

describe("getSuggestions affinity", () => {
  it("ranks a board-aroma-sharing candidate above an equal-fill one that shares nothing", () => {
    const pool = [
      ing("cand_share", { umami: 0.5 }, ["briny", "savory"]),
      ing("cand_noshare", { umami: 0.5 }, ["floral", "woody"]),
      ing("board_anchovy", { umami: 0.9, salt: 0.8 }, ["briny", "savory"]),
    ];
    const sugg = getSuggestions({
      committed: [row(1, "board_anchovy")],
      byId: poolById(pool),
      pool,
      intent: richIntent,
      risk: 0.3,
      suggestionCount: 5,
      activeCompName: "the dish",
    });
    expect(sugg[0].id).toBe("cand_share");
    expect(sugg.find((s) => s.id === "cand_share")!.shared).toContain("briny");
  });

  it("IDF: a rare shared tag outranks a common one, fill held equal", () => {
    const pool = [
      ing("cand_rare", { umami: 0.5 }, ["zeta", "q1"]),
      ing("cand_common", { umami: 0.5 }, ["alpha", "q2"]),
      ing("board_x", { umami: 0.9 }, ["zeta", "alpha"]),
      ...Array.from({ length: 5 }, (_, i) => ing(`fill${i}`, {}, ["alpha", `j${i}`])),
    ];
    const sugg = getSuggestions({
      committed: [row(1, "board_x")],
      byId: poolById(pool),
      pool,
      intent: richIntent,
      risk: 0.3,
      suggestionCount: 10,
      activeCompName: "the dish",
    });
    const ids = sugg.map((s) => s.id);
    expect(ids.indexOf("cand_rare")).toBeLessThan(ids.indexOf("cand_common"));
  });

  it("routes a missing contrast into ranking + why (all-soft board surfaces crunch)", () => {
    const pool = [
      ing("board_soft1", { umami: 0.5 }, ["b1"], 0.3, "creamy", "cold"),
      ing("board_soft2", { umami: 0.5 }, ["b2"], 0.3, "tender", "cold"),
      ing("cand_crunch", { umami: 0.5 }, ["c1"], 0.3, "crunchy", "room"),
      ing("cand_plain", { umami: 0.5 }, ["c2"], 0.3, "neutral", "room"),
    ];
    const sugg = getSuggestions({
      committed: [row(1, "board_soft1"), row(2, "board_soft2")],
      byId: poolById(pool),
      pool,
      intent: richIntent,
      risk: 0.3,
      suggestionCount: 5,
      activeCompName: "the dish",
    });
    expect(sugg[0].id).toBe("cand_crunch");
    const crunch = sugg.find((s) => s.id === "cand_crunch")!;
    expect(crunch.why).toBe("Adds the crunch you're missing.");
    expect(crunch.contrast).toBe("Adds the crunch you're missing.");
    expect(sugg.find((s) => s.id === "cand_plain")!.contrast).toBe("");
  });

  it("routes the direction's open lean-role into ranking + why (pasta missing acid)", () => {
    const pasta = FORMS.find((f) => f.id === "pasta")!; // leans on base/fat/salt/acid/finish
    const pool = [
      ing("board_base", { umami: 0.5 }, ["b1"], 0.3, "neutral", "room", ["base"]),
      ing("cand_acid", { umami: 0.5 }, ["c1"], 0.3, "neutral", "room", ["acid"]),
      ing("cand_base", { umami: 0.5 }, ["c2"], 0.3, "neutral", "room", ["base"]),
    ];
    const sugg = getSuggestions({
      committed: [row(1, "board_base")], // row() commits with role "base" → base filled, acid open
      byId: poolById(pool),
      pool,
      intent: richIntent,
      risk: 0.3,
      suggestionCount: 5,
      activeCompName: "the dish",
      form: pasta,
    });
    expect(sugg[0].id).toBe("cand_acid");
    const acid = sugg.find((s) => s.id === "cand_acid")!;
    expect(acid.why).toBe("Brings the acid a pasta & sauce leans on.");
    expect(acid.structure).toBe("Brings the acid a pasta & sauce leans on.");
    expect(sugg.find((s) => s.id === "cand_base")!.structure).toBe("");
  });

  it("no direction → structure signal stays off (shared/contrast/structure empty)", () => {
    const sugg = getSuggestions({
      committed: [],
      byId,
      pool: PANTRY as Ingredient[],
      intent: INTENTS[0],
      risk: 0.3,
      suggestionCount: 5,
      activeCompName: "the dish",
    });
    sugg.forEach((s) => expect(s.structure).toBe(""));
  });

  it("empty board → no affinity, no crash, shared empty", () => {
    const sugg = getSuggestions({
      committed: [],
      byId,
      pool: PANTRY as Ingredient[],
      intent: INTENTS[0],
      risk: 0.3,
      suggestionCount: 7,
      activeCompName: "the dish",
    });
    expect(sugg.length).toBe(7);
    sugg.forEach((s) => expect(s.shared).toHaveLength(0));
  });
});

describe("buildWhy affinity phrasing", () => {
  const anchovy = PANTRY.find((p) => p.id === "anchovy")! as Ingredient;
  const vinegar = PANTRY.find((p) => p.id === "sherry_vinegar")! as Ingredient;

  it("leads with pairing when affinity-led", () => {
    expect(buildWhy(anchovy, { ...ZERO_AXES }, ["briny", "savory"], true)).toBe(
      "Plays off the briny, savory notes already on the board.",
    );
  });

  it("uses a gap move otherwise", () => {
    const low = { ...ZERO_AXES, sour: 0.8 } as AxisMap;
    const why = buildWhy(vinegar, low, [], false);
    expect(why).toContain("acid");
    expect(why).not.toContain("Plays off");
  });
});
