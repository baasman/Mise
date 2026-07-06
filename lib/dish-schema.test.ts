import { describe, expect, it } from "vitest";
import { dishSnapshotSchema } from "./dish-schema";

// Mirrors what useMise.snapshot() actually produces — a realistic saved dish.
const realistic = {
  name: "Sunday tangle",
  intentId: "umami_rich",
  customIntent: null,
  formId: "risotto",
  customForm: null,
  components: [{ id: "c1", name: "The grain", notes: "toast it first" }],
  committed: [
    {
      uid: 1,
      ingredientId: "anchovy",
      magnitude: "supporting",
      role: "umami",
      componentId: "c1",
      amount: "3 fillets",
      aromas: ["briny", "savory"],
    },
    {
      uid: 2,
      ingredientId: "cust_1",
      magnitude: "trace",
      role: "finish",
      componentId: "c1",
      axes: { salt: 0.1, sweet: 0, sour: 0.6, bitter: 0, umami: 0, fat: 0, heat: 0 },
      texture: "crisp",
      temperature: "cold",
    },
  ],
  customIngredients: [
    {
      id: "cust_1",
      name: "dragonfruit foam",
      roles: ["finish"],
      aromas: ["floral"],
      novelty: 0.9,
      axes: { salt: 0, sweet: 0.4, sour: 0.2, bitter: 0, umami: 0, fat: 0.1, heat: 0 },
      texture: "creamy",
      temperature: "cold",
      custom: true,
      unprofiled: false,
      estimating: false, // transient client field — must be stripped, not rejected
    },
  ],
  activeComp: "c1",
  risk: 0.3,
  method: "Bloom the aromatics.",
  servings: 2,
  cid: 2,
  uid: 3,
  custId: 2,
};

describe("dishSnapshotSchema", () => {
  it("accepts a realistic snapshot and strips transient client fields", () => {
    const r = dishSnapshotSchema.safeParse(realistic);
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data.customIngredients[0] as Record<string, unknown>).estimating).toBeUndefined();
    }
  });

  it("accepts a blank new-dish snapshot", () => {
    const blank = {
      ...realistic,
      name: "",
      intentId: "bright_sharp",
      formId: null,
      components: [{ id: "c1", name: "" }],
      committed: [],
      customIngredients: [],
      method: "",
      cid: 2,
      uid: 1,
      custId: 1,
    };
    expect(dishSnapshotSchema.safeParse(blank).success).toBe(true);
  });

  it("rejects out-of-bounds payloads (huge method, bad magnitude, giant arrays)", () => {
    expect(dishSnapshotSchema.safeParse({ ...realistic, method: "x".repeat(30_000) }).success).toBe(false);
    expect(
      dishSnapshotSchema.safeParse({
        ...realistic,
        committed: [{ ...realistic.committed[0], magnitude: "enormous" }],
      }).success,
    ).toBe(false);
    expect(
      dishSnapshotSchema.safeParse({
        ...realistic,
        committed: Array.from({ length: 301 }, (_, i) => ({ ...realistic.committed[0], uid: i })),
      }).success,
    ).toBe(false);
  });

  it("rejects non-snapshot garbage", () => {
    expect(dishSnapshotSchema.safeParse({ evil: "blob" }).success).toBe(false);
    expect(dishSnapshotSchema.safeParse("just a string").success).toBe(false);
  });
});
