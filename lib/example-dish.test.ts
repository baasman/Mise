import { describe, expect, it } from "vitest";
import { EXAMPLE_DISH } from "./example-dish";
import { dishSnapshotSchema } from "./dish-schema";
import { FORMS, INTENTS, PANTRY } from "./domain";

describe("EXAMPLE_DISH", () => {
  it("references only ingredients that exist in the static seed pantry", () => {
    const ids = new Set(PANTRY.map((p) => p.id));
    EXAMPLE_DISH.committed.forEach((c) => {
      expect(ids.has(c.ingredientId), `unknown ingredient: ${c.ingredientId}`).toBe(true);
    });
  });

  it("uses a real intent and direction, and rows point at real components", () => {
    expect(INTENTS.some((i) => i.id === EXAMPLE_DISH.intentId)).toBe(true);
    expect(FORMS.some((f) => f.id === EXAMPLE_DISH.formId)).toBe(true);
    const comps = new Set(EXAMPLE_DISH.components.map((c) => c.id));
    EXAMPLE_DISH.committed.forEach((c) => expect(comps.has(c.componentId)).toBe(true));
    expect(comps.has(EXAMPLE_DISH.activeComp || "")).toBe(true);
  });

  it("is a valid, saveable snapshot (passes the API schema)", () => {
    expect(dishSnapshotSchema.safeParse(EXAMPLE_DISH).success).toBe(true);
  });

  it("keeps uid/cid counters above the rows/components it contains", () => {
    const maxUid = Math.max(...EXAMPLE_DISH.committed.map((c) => c.uid));
    expect(EXAMPLE_DISH.uid).toBeGreaterThan(maxUid);
    const maxCid = Math.max(...EXAMPLE_DISH.components.map((c) => parseInt(c.id.slice(1), 10)));
    expect(EXAMPLE_DISH.cid).toBeGreaterThan(maxCid);
  });
});
