import { describe, expect, it } from "vitest";
import { INTENTS, PANTRY } from "./domain";
import { getSuggestions, intentGap, type ById } from "./engine";
import { buildWhyRequest } from "./why-request";
import type { CommittedRow, Ingredient } from "./types";

const byId: ById = (id) => PANTRY.find((p) => p.id === id) as Ingredient | undefined;
const intent = INTENTS[0];

const rows: CommittedRow[] = [
  { uid: 1, ingredientId: "olive_oil", magnitude: "supporting", role: "base", componentId: "c1" },
  { uid: 2, ingredientId: "roasted_tomato", magnitude: "dominant", role: "base", componentId: "c1" },
];

function key(committed: CommittedRow[]) {
  const suggestions = getSuggestions({
    committed,
    byId,
    pool: PANTRY as Ingredient[],
    intent,
    risk: 0.3,
    suggestionCount: 12,
    activeCompName: "the dish",
  });
  return JSON.stringify(buildWhyRequest(suggestions, committed, byId, intent, intentGap(committed, byId, intent)));
}

describe("buildWhyRequest as the refetch key", () => {
  it("ignores edits Haiku never sees (amounts)", () => {
    const withAmount = rows.map((r) => (r.uid === 1 ? { ...r, amount: "2 tbsp" } : r));
    expect(key(withAmount)).toBe(key(rows));
  });

  it("changes when the board's flavor changes", () => {
    const louder = rows.map((r) => (r.uid === 1 ? { ...r, magnitude: "dominant" as const } : r));
    expect(key(louder)).not.toBe(key(rows));
  });

  it("caps candidates at 12 and partners at 3", () => {
    const suggestions = getSuggestions({
      committed: rows,
      byId,
      pool: PANTRY as Ingredient[],
      intent,
      risk: 0.3,
      suggestionCount: 30,
      activeCompName: "the dish",
    });
    const req = buildWhyRequest(suggestions, rows, byId, intent, intentGap(rows, byId, intent))!;
    expect(req.candidates.length).toBeLessThanOrEqual(12);
    for (const c of req.candidates) expect((c.partners ?? []).length).toBeLessThanOrEqual(3);
  });

  it("returns null with nothing to explain", () => {
    expect(buildWhyRequest([], rows, byId, intent, intentGap(rows, byId, intent))).toBeNull();
  });
});
