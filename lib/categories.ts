// Food-group ("kind") for an ingredient — a dimension the flavor engine doesn't
// have. Vegetables, proteins, and starches are flavor-quiet *bodies*: they barely
// move the radar, so a flavor-ranked suggestion list never surfaces them. This lets
// the cook reach for a component ("I need a veg") by food-group instead of flavor.
//
// Derived from the 37-category vocabulary (lib/pantry-vocabulary) collapsed to a
// handful of coarse kinds. Lookup is by name (case-insensitive); the ~30 hand-seeded
// items that predate the vocabulary get a small override map.
import { VOCAB_CATEGORY } from "./pantry-vocabulary";

export type Kind =
  | "vegetable"
  | "fruit"
  | "protein"
  | "grain"
  | "dairy"
  | "herb"
  | "spice"
  | "fat"
  | "nut"
  | "condiment"
  | "sweet"
  | "other";

const CATEGORY_KIND: Record<string, Kind> = {
  "Fruiting & nightshade vegetables": "vegetable",
  Brassicas: "vegetable",
  "Root & tuber vegetables": "vegetable",
  "Squash & gourds": "vegetable",
  "Leafy & salad greens": "vegetable",
  Alliums: "vegetable",
  "Sea vegetables": "vegetable",
  "Mushrooms & fungi": "vegetable",
  "Meat, poultry & game": "protein",
  "Seafood & shellfish": "protein",
  "Cured meats & charcuterie": "protein",
  "Cured & preserved fish": "protein",
  "Soy & plant proteins": "protein",
  "Legumes & pulses": "protein",
  "Grains & starches": "grain",
  "Pasta & noodles": "grain",
  "Breads & baked starches": "grain",
  Cheese: "dairy",
  "Dairy & eggs": "dairy",
  "Fresh herbs": "herb",
  "Dried spices": "spice",
  "Chiles & hot peppers": "spice",
  "Aromatics & specialty": "spice",
  Citrus: "fruit",
  "Pome & vine fruit": "fruit",
  "Tropical fruit": "fruit",
  "Stone fruit": "fruit",
  Berries: "fruit",
  "Dried fruit": "fruit",
  "Oils & fats": "fat",
  "Nuts & seeds": "nut",
  "Acids & vinegars": "condiment",
  "Condiments, sauces & pastes": "condiment",
  "Ferments & pickles": "condiment",
  Sweeteners: "sweet",
  "Chocolate, coffee, tea & botanicals": "other",
  "Wine & spirits for cooking": "other",
};

// Hand-seeded prototype items (descriptive names) that the vocabulary doesn't cover.
const SEED_KIND: Record<string, Kind> = {
  "roasted garlic": "vegetable",
  "charred scallion": "vegetable",
  "shaved fennel": "vegetable",
  anchovy: "protein",
  "fresh mint": "herb",
  "aged parmesan": "dairy",
  "toasted walnut": "nut",
};

let cache: Map<string, Kind> | null = null;
function nameKind(): Map<string, Kind> {
  if (cache) return cache;
  cache = new Map();
  for (const [name, cat] of Object.entries(VOCAB_CATEGORY)) {
    const k = CATEGORY_KIND[cat];
    if (k) cache.set(name.toLowerCase(), k);
  }
  for (const [name, k] of Object.entries(SEED_KIND)) cache.set(name, k);
  return cache;
}

export function kindOf(name: string): Kind {
  return nameKind().get(name.toLowerCase()) || "other";
}
