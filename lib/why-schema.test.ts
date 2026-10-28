import { describe, expect, it } from "vitest";
import { whyRequestSchema } from "./why-schema";

const valid = {
  board: {
    intentLabel: "Bright & sharp",
    dishName: "Sunday tangle",
    low: { salt: 0.2, sour: 0.4 },
    aromas: ["briny", "citrus"],
  },
  candidates: [
    { id: "lemon", name: "Lemon", roles: ["acid"], shared: ["citrus"], partners: ["Anchovy", "Garlic"] },
  ],
};

describe("whyRequestSchema", () => {
  it("accepts what the client sends", () => {
    expect(whyRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("clips long strings and lists instead of rejecting them", () => {
    const r = whyRequestSchema.parse({
      board: { ...valid.board, dishName: "x".repeat(500), aromas: Array.from({ length: 200 }, (_, i) => `a${i}`) },
      candidates: [{ ...valid.candidates[0], name: "y".repeat(500), partners: Array(50).fill("Tomato") }],
    });
    expect(r.board.dishName).toHaveLength(120);
    expect(r.board.aromas).toHaveLength(40);
    expect(r.candidates[0].name).toHaveLength(80);
    expect(r.candidates[0].partners).toHaveLength(3);
  });

  it("clamps gap values and drops unknown axes", () => {
    const r = whyRequestSchema.parse({ ...valid, board: { ...valid.board, low: { salt: 5, sour: -1, bogus: 1 } } });
    expect(r.board.low).toEqual({ salt: 1, sour: 0 });
  });

  it("rejects more than 12 candidates", () => {
    const candidates = Array.from({ length: 13 }, (_, i) => ({ id: `c${i}`, name: "x", roles: [] }));
    expect(whyRequestSchema.safeParse({ ...valid, candidates }).success).toBe(false);
  });
});
