// Mise — typed fetch wrappers for the thin backend. All requests carry the
// anonymous device cookie automatically (same-origin, credentials included).
import type { AxisMap, Role, Temperature, Texture } from "./domain";
import type { DishSnapshot, Ingredient, Suggestion } from "./types";

const json = { "Content-Type": "application/json" };

export interface PantryResponse {
  pantry: Ingredient[]; // global seed
  custom: Ingredient[]; // this device's own ingredients
}

export async function fetchPantry(): Promise<PantryResponse> {
  const r = await fetch("/api/pantry", { credentials: "same-origin" });
  if (!r.ok) throw new Error("pantry fetch failed");
  return r.json();
}

export interface EstimateResponse {
  axes: AxisMap;
  aromas: string[];
  texture: Texture;
  temperature: Temperature;
  roles: Role[];
  novelty: number;
  provenance: "estimate";
}

export async function estimateFlavor(name: string): Promise<EstimateResponse> {
  const r = await fetch("/api/ingredients/estimate", {
    method: "POST",
    headers: json,
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error("estimate failed");
  return r.json();
}

export interface WhyRequestCandidate {
  id: string;
  name: string;
  roles: string[];
  shared?: string[];
  contrast?: string;
  structure?: string;
}

export async function fetchWhy(
  board: { intentLabel: string; dishName: string; low: AxisMap; aromas?: string[] },
  candidates: WhyRequestCandidate[],
): Promise<Record<string, string>> {
  const r = await fetch("/api/suggestions/why", {
    method: "POST",
    headers: json,
    credentials: "same-origin",
    body: JSON.stringify({ board, candidates }),
  });
  if (!r.ok) throw new Error("why failed");
  const data = (await r.json()) as { why: { id: string; why: string }[] };
  const out: Record<string, string> = {};
  for (const w of data.why) out[w.id] = w.why;
  return out;
}

export interface SavedDish extends DishSnapshot {
  id: string;
  savedAt: number;
}

export async function fetchDishes(): Promise<SavedDish[]> {
  const r = await fetch("/api/dishes", { credentials: "same-origin" });
  if (!r.ok) throw new Error("dishes fetch failed");
  return r.json();
}

export async function saveDish(snapshot: DishSnapshot): Promise<SavedDish> {
  const r = await fetch("/api/dishes", {
    method: "POST",
    headers: json,
    credentials: "same-origin",
    body: JSON.stringify(snapshot),
  });
  if (!r.ok) throw new Error("save failed");
  return r.json();
}

export async function deleteDish(id: string): Promise<void> {
  const r = await fetch(`/api/dishes/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!r.ok) throw new Error("delete failed");
}

export async function persistCustomIngredient(ing: Ingredient): Promise<void> {
  // best-effort; the dish snapshot also carries custom ingredients
  await fetch("/api/ingredients", {
    method: "POST",
    headers: json,
    credentials: "same-origin",
    body: JSON.stringify(ing),
  }).catch(() => {});
}

export type { Suggestion };
