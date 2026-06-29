// Mise — domain constants, pantry, and types.
// Ported verbatim from Mise.dc.html so the radar math and vocabulary match the
// prototype exactly. Role *labels* are job-words deliberately distinct from the
// taste-axis names (so "role = job" and "axis = taste" never collide).

import type { Kind } from "./categories";

export type Axis = "salt" | "sweet" | "sour" | "bitter" | "umami" | "fat" | "heat";
export type Magnitude = "trace" | "supporting" | "dominant";
export type Provenance = "estimate" | "your read" | "unprofiled";

// Non-taste dimensions (P1). Coarse, intrinsic-ish defaults on the ingredient,
// inherited by each committed row and overridable per row (like axes/aromas).
export type Texture = "crunchy" | "crisp" | "creamy" | "tender" | "chewy" | "juicy" | "neutral";
export type Temperature = "cold" | "room" | "warm";

export type AxisMap = Record<Axis, number>;

export const AXES: Axis[] = ["salt", "sweet", "sour", "bitter", "umami", "fat", "heat"];

// Radar draw order (visual), distinct from the canonical AXES order.
export const RADAR_ORDER: Axis[] = ["salt", "umami", "fat", "heat", "bitter", "sour", "sweet"];

export const AXIS_SHORT: Record<Axis, string> = {
  salt: "SALT",
  umami: "UMAMI",
  fat: "RICH",
  heat: "HEAT",
  bitter: "BITTER",
  sour: "SOUR",
  sweet: "SWEET",
};

// Prose name for an axis, used in flags.
export const AXIS_NAME: Record<Axis, string> = {
  salt: "salt",
  sweet: "sweetness",
  sour: "acid",
  bitter: "bitterness",
  umami: "umami",
  fat: "richness",
  heat: "heat",
};

// Structural roles (the *job* an ingredient does). Internal ids stay stable;
// only the displayed label changes via ROLE_LABEL.
export const ROLES = [
  "base",
  "fat",
  "acid",
  "salt",
  "aromatic",
  "heat",
  "sweet",
  "bitter",
  "umami",
  "texture",
  "finish",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  base: "base",
  fat: "body",
  acid: "acid",
  salt: "seasoning",
  aromatic: "aromatic",
  heat: "spice",
  sweet: "sweetener",
  bitter: "edge",
  umami: "savory",
  texture: "texture",
  finish: "finish",
};

export const MAG_W: Record<Magnitude, number> = {
  trace: 0.3,
  supporting: 1.0,
  dominant: 2.0,
};

// Verb fragment per axis, used when phrasing a suggestion's "why" locally.
export const VERB: Record<Axis, string> = {
  salt: "seasons it",
  sweet: "rounds it with sweetness",
  sour: "lifts it with acid",
  bitter: "adds a bitter edge",
  umami: "deepens the savory base",
  fat: "adds richness and body",
  heat: "brings a layer of heat",
};

// ---- texture / temperature (P1) ----
export const TEXTURES: Texture[] = ["crunchy", "crisp", "creamy", "tender", "chewy", "juicy", "neutral"];
export const TEMPERATURES: Temperature[] = ["cold", "room", "warm"];

export type TextureFamily = "crunch" | "soft" | "chew" | "fresh" | "neutral";

// Group textures into families so the contrast readout can ask "is there crunch?
// is there something soft?" rather than reasoning over every individual texture.
export const TEXTURE_FAMILY: Record<Texture, TextureFamily> = {
  crunchy: "crunch",
  crisp: "crunch",
  creamy: "soft",
  tender: "soft",
  chewy: "chew",
  juicy: "fresh",
  neutral: "neutral",
};

export const FAMILY_LABEL: Record<TextureFamily, string> = {
  crunch: "crunch",
  soft: "something soft",
  chew: "chew",
  fresh: "something fresh",
  neutral: "neutral",
};

export interface PantryItem {
  id: string;
  name: string;
  roles: Role[];
  aromas: string[];
  novelty: number;
  axes: AxisMap;
  texture: Texture;
  temperature: Temperature;
}

export const PANTRY: PantryItem[] = [
  { id: "olive_oil", name: "Olive oil", roles: ["base", "fat"], aromas: ["grassy", "peppery"], novelty: 0.1, axes: { salt: 0.05, sweet: 0.05, sour: 0.05, bitter: 0.15, umami: 0.1, fat: 0.85, heat: 0.05 }, texture: "neutral", temperature: "room" },
  { id: "brown_butter", name: "Brown butter", roles: ["fat", "base"], aromas: ["nutty", "toasty"], novelty: 0.35, axes: { salt: 0.1, sweet: 0.15, sour: 0.0, bitter: 0.1, umami: 0.45, fat: 0.95, heat: 0.0 }, texture: "neutral", temperature: "warm" },
  { id: "preserved_lemon", name: "Preserved lemon", roles: ["acid", "salt", "finish"], aromas: ["briny", "floral", "bright"], novelty: 0.55, axes: { salt: 0.65, sweet: 0.05, sour: 0.8, bitter: 0.2, umami: 0.15, fat: 0.0, heat: 0.05 }, texture: "tender", temperature: "room" },
  { id: "anchovy", name: "Anchovy", roles: ["salt", "umami"], aromas: ["briny", "savory"], novelty: 0.5, axes: { salt: 0.85, sweet: 0.05, sour: 0.05, bitter: 0.1, umami: 0.9, fat: 0.2, heat: 0.0 }, texture: "tender", temperature: "room" },
  { id: "white_miso", name: "White miso", roles: ["umami", "salt"], aromas: ["fermented", "malty"], novelty: 0.45, axes: { salt: 0.7, sweet: 0.2, sour: 0.05, bitter: 0.1, umami: 0.9, fat: 0.1, heat: 0.0 }, texture: "creamy", temperature: "room" },
  { id: "parmesan", name: "Aged parmesan", roles: ["umami", "salt", "fat"], aromas: ["nutty", "sharp"], novelty: 0.25, axes: { salt: 0.7, sweet: 0.1, sour: 0.1, bitter: 0.1, umami: 0.85, fat: 0.4, heat: 0.0 }, texture: "crunchy", temperature: "room" },
  { id: "smoked_paprika", name: "Smoked paprika", roles: ["aromatic", "heat"], aromas: ["smoky", "sweet-pepper"], novelty: 0.4, axes: { salt: 0.05, sweet: 0.25, sour: 0.0, bitter: 0.2, umami: 0.2, fat: 0.0, heat: 0.45 }, texture: "neutral", temperature: "room" },
  { id: "fennel", name: "Shaved fennel", roles: ["aromatic", "texture"], aromas: ["anise", "fresh"], novelty: 0.3, axes: { salt: 0.0, sweet: 0.4, sour: 0.1, bitter: 0.25, umami: 0.05, fat: 0.0, heat: 0.0 }, texture: "crisp", temperature: "cold" },
  { id: "roasted_garlic", name: "Roasted garlic", roles: ["aromatic", "base"], aromas: ["mellow", "savory"], novelty: 0.2, axes: { salt: 0.05, sweet: 0.45, sour: 0.0, bitter: 0.1, umami: 0.4, fat: 0.05, heat: 0.05 }, texture: "creamy", temperature: "warm" },
  { id: "sherry_vinegar", name: "Sherry vinegar", roles: ["acid"], aromas: ["oaky", "bright"], novelty: 0.35, axes: { salt: 0.05, sweet: 0.1, sour: 0.9, bitter: 0.1, umami: 0.05, fat: 0.0, heat: 0.0 }, texture: "neutral", temperature: "room" },
  { id: "pom_molasses", name: "Pomegranate molasses", roles: ["acid", "sweet", "finish"], aromas: ["tart", "fruity"], novelty: 0.6, axes: { salt: 0.0, sweet: 0.6, sour: 0.7, bitter: 0.15, umami: 0.05, fat: 0.0, heat: 0.0 }, texture: "neutral", temperature: "room" },
  { id: "walnut", name: "Toasted walnut", roles: ["fat", "bitter", "texture"], aromas: ["nutty", "woody"], novelty: 0.35, axes: { salt: 0.0, sweet: 0.1, sour: 0.0, bitter: 0.45, umami: 0.15, fat: 0.6, heat: 0.0 }, texture: "crunchy", temperature: "room" },
  { id: "honey", name: "Honey", roles: ["sweet", "finish"], aromas: ["floral", "warm"], novelty: 0.25, axes: { salt: 0.0, sweet: 0.95, sour: 0.1, bitter: 0.0, umami: 0.0, fat: 0.0, heat: 0.0 }, texture: "neutral", temperature: "room" },
  { id: "dijon", name: "Dijon mustard", roles: ["acid", "heat"], aromas: ["sharp", "pungent"], novelty: 0.35, axes: { salt: 0.3, sweet: 0.1, sour: 0.5, bitter: 0.15, umami: 0.1, fat: 0.05, heat: 0.45 }, texture: "creamy", temperature: "room" },
  { id: "capers", name: "Capers", roles: ["salt", "acid", "finish"], aromas: ["briny", "floral"], novelty: 0.45, axes: { salt: 0.75, sweet: 0.0, sour: 0.55, bitter: 0.2, umami: 0.2, fat: 0.0, heat: 0.0 }, texture: "tender", temperature: "room" },
  { id: "yogurt", name: "Greek yogurt", roles: ["fat", "acid", "base"], aromas: ["tangy", "creamy"], novelty: 0.2, axes: { salt: 0.1, sweet: 0.1, sour: 0.45, bitter: 0.0, umami: 0.1, fat: 0.5, heat: 0.0 }, texture: "creamy", temperature: "cold" },
  { id: "tahini", name: "Tahini", roles: ["fat", "bitter", "base"], aromas: ["nutty", "earthy"], novelty: 0.4, axes: { salt: 0.05, sweet: 0.05, sour: 0.0, bitter: 0.4, umami: 0.2, fat: 0.8, heat: 0.0 }, texture: "creamy", temperature: "room" },
  { id: "chili_crisp", name: "Chili crisp", roles: ["heat", "umami", "texture", "finish"], aromas: ["smoky", "savory"], novelty: 0.65, axes: { salt: 0.4, sweet: 0.1, sour: 0.0, bitter: 0.15, umami: 0.5, fat: 0.4, heat: 0.85 }, texture: "crunchy", temperature: "room" },
  { id: "black_pepper", name: "Black pepper", roles: ["heat", "aromatic", "finish"], aromas: ["woody", "sharp"], novelty: 0.2, axes: { salt: 0.0, sweet: 0.0, sour: 0.0, bitter: 0.2, umami: 0.05, fat: 0.0, heat: 0.5 }, texture: "neutral", temperature: "room" },
  { id: "mint", name: "Fresh mint", roles: ["aromatic", "finish"], aromas: ["cooling", "green"], novelty: 0.3, axes: { salt: 0.0, sweet: 0.15, sour: 0.05, bitter: 0.15, umami: 0.0, fat: 0.0, heat: 0.05 }, texture: "juicy", temperature: "cold" },
  { id: "lemon_zest", name: "Lemon zest", roles: ["acid", "aromatic", "finish"], aromas: ["bright", "citrus"], novelty: 0.25, axes: { salt: 0.0, sweet: 0.1, sour: 0.55, bitter: 0.2, umami: 0.0, fat: 0.0, heat: 0.0 }, texture: "neutral", temperature: "room" },
  { id: "egg_yolk", name: "Soy-cured egg yolk", roles: ["umami", "fat", "finish"], aromas: ["rich", "savory"], novelty: 0.7, axes: { salt: 0.55, sweet: 0.1, sour: 0.0, bitter: 0.0, umami: 0.8, fat: 0.7, heat: 0.0 }, texture: "creamy", temperature: "cold" },
  { id: "caramelized_onion", name: "Caramelized onion", roles: ["sweet", "base", "aromatic"], aromas: ["jammy", "deep"], novelty: 0.25, axes: { salt: 0.05, sweet: 0.7, sour: 0.05, bitter: 0.1, umami: 0.4, fat: 0.1, heat: 0.0 }, texture: "tender", temperature: "warm" },
  { id: "roasted_tomato", name: "Roasted tomato", roles: ["umami", "base", "acid"], aromas: ["concentrated", "sweet"], novelty: 0.2, axes: { salt: 0.1, sweet: 0.5, sour: 0.4, bitter: 0.1, umami: 0.6, fat: 0.05, heat: 0.0 }, texture: "tender", temperature: "warm" },
  { id: "sourdough", name: "Sourdough crumb", roles: ["base", "texture"], aromas: ["toasty", "tangy"], novelty: 0.2, axes: { salt: 0.15, sweet: 0.1, sour: 0.25, bitter: 0.1, umami: 0.1, fat: 0.1, heat: 0.0 }, texture: "crisp", temperature: "warm" },
  { id: "olives", name: "Cured olives", roles: ["salt", "bitter", "finish"], aromas: ["briny", "fruity"], novelty: 0.4, axes: { salt: 0.8, sweet: 0.0, sour: 0.25, bitter: 0.45, umami: 0.3, fat: 0.25, heat: 0.0 }, texture: "tender", temperature: "room" },
  { id: "maldon", name: "Maldon salt", roles: ["salt", "finish"], aromas: ["clean", "mineral"], novelty: 0.1, axes: { salt: 1.0, sweet: 0.0, sour: 0.0, bitter: 0.0, umami: 0.05, fat: 0.0, heat: 0.0 }, texture: "crisp", temperature: "room" },
  { id: "dark_choc", name: "Dark chocolate", roles: ["bitter", "sweet", "fat"], aromas: ["roasted", "deep"], novelty: 0.75, axes: { salt: 0.05, sweet: 0.4, sour: 0.05, bitter: 0.7, umami: 0.1, fat: 0.45, heat: 0.0 }, texture: "crisp", temperature: "room" },
  { id: "ginger", name: "Fresh ginger", roles: ["heat", "aromatic"], aromas: ["sharp", "citrus"], novelty: 0.35, axes: { salt: 0.0, sweet: 0.15, sour: 0.1, bitter: 0.1, umami: 0.0, fat: 0.0, heat: 0.55 }, texture: "crunchy", temperature: "room" },
  { id: "charred_scallion", name: "Charred scallion", roles: ["aromatic", "base"], aromas: ["smoky", "green"], novelty: 0.35, axes: { salt: 0.05, sweet: 0.2, sour: 0.0, bitter: 0.2, umami: 0.25, fat: 0.05, heat: 0.1 }, texture: "tender", temperature: "warm" },
];

export interface Intent {
  id: string;
  label: string;
  blurb: string;
  emphasis: string;
  targets: Partial<AxisMap>;
}

export const INTENTS: Intent[] = [
  { id: "bright_sharp", label: "Bright & Sharp", blurb: "Acid-forward and lifted — food that wakes the palate up.", emphasis: "acid · heat", targets: { sour: 0.7, heat: 0.4, fat: 0.25 } },
  { id: "rich_comforting", label: "Rich & Comforting", blurb: "Deep, round and satisfying — the plate you sink into.", emphasis: "richness · umami", targets: { fat: 0.7, umami: 0.7, sour: 0.2 } },
  { id: "earthy_warming", label: "Earthy & Warming", blurb: "Grounded and savory, with a low smoulder underneath.", emphasis: "umami · bitter · heat", targets: { umami: 0.6, bitter: 0.45, heat: 0.4 } },
  { id: "fresh_green", label: "Fresh & Green", blurb: "Clean and herbaceous — light on its feet, barely any fat.", emphasis: "acid · aromatic", targets: { sour: 0.5, fat: 0.2, salt: 0.35 } },
  { id: "bold_spicy", label: "Bold & Spicy", blurb: "Heat up front, with enough savory weight to carry it.", emphasis: "heat · savory", targets: { heat: 0.7, umami: 0.4, salt: 0.4 } },
  { id: "sweet_savory", label: "Sweet & Savory", blurb: "The sweet-salty pull — caramel and umami leaning on each other.", emphasis: "sweet · umami", targets: { sweet: 0.55, umami: 0.55, salt: 0.4 } },
  { id: "umami_rich", label: "Umami-Rich", blurb: "Deep savory saturation — the long, mouth-filling kind.", emphasis: "umami · salt", targets: { umami: 0.8, salt: 0.5, fat: 0.45 } },
  { id: "bitter_complex", label: "Bitter & Complex", blurb: "Grown-up and a little bitter, with savory depth underneath.", emphasis: "bitter · umami", targets: { bitter: 0.6, umami: 0.45, sour: 0.3 } },
  { id: "light_delicate", label: "Light & Delicate", blurb: "Restrained and clean — a whisper of acid, almost no fat.", emphasis: "clean · acid", targets: { sour: 0.4, salt: 0.3, sweet: 0.25, fat: 0.15 } },
];

export interface Form {
  id: string;
  label: string;
  kicker: string;
  blurb: string;
  leanRoles: Role[];
  typicalComponents: string[];
}

export const FORMS: Form[] = [
  { id: "roast", label: "Roast", kicker: "A ROAST", blurb: "Built around a roasted centerpiece — chicken, squash, a whole head of cauliflower.", leanRoles: ["base", "fat", "aromatic", "salt", "finish"], typicalComponents: ["The roast", "Pan sauce", "A fresh side", "Garnish"] },
  { id: "pasta", label: "Pasta & sauce", kicker: "PASTA & SAUCE", blurb: "A sauce that clings — emulsified fat, salt, and a little acid to keep it lively.", leanRoles: ["base", "fat", "salt", "acid", "finish"], typicalComponents: ["The pasta", "The sauce", "To finish"] },
  { id: "bowl", label: "Grain bowl", kicker: "A GRAIN BOWL", blurb: "A grain or legume base, dressed and layered with plenty of texture on top.", leanRoles: ["base", "acid", "fat", "aromatic", "texture", "finish"], typicalComponents: ["The base", "The dressing", "Toppings", "Crunch"] },
  { id: "salad", label: "Salad", kicker: "A SALAD", blurb: "Raw or barely-cooked, held together by a sharp dressing and real contrast.", leanRoles: ["acid", "fat", "texture", "aromatic", "finish"], typicalComponents: ["The leaves", "The dressing", "Add-ons"] },
  { id: "braise", label: "Soup / braise", kicker: "SOUP / BRAISE", blurb: "Slow and savory — aromatics bloomed, depth built over time in liquid.", leanRoles: ["base", "aromatic", "salt", "fat", "umami"], typicalComponents: ["The braise", "Aromatic base", "To serve"] },
  { id: "spread", label: "Dip / spread", kicker: "A DIP / SPREAD", blurb: "A scoopable base whipped smooth, then brightened and seasoned to taste.", leanRoles: ["base", "fat", "acid", "salt", "finish"], typicalComponents: ["The base", "Seasoning", "To top"] },
  { id: "stirfry", label: "Stir-fry", kicker: "A STIR-FRY", blurb: "Hot and fast in the wok — everything cut to cook in minutes, sauce at the end.", leanRoles: ["base", "aromatic", "salt", "umami", "heat", "finish"], typicalComponents: ["The protein", "The vegetables", "The sauce", "To finish"] },
  { id: "taco", label: "Tacos & wraps", kicker: "TACOS & WRAPS", blurb: "A handheld build — a warm wrap, a filling, and the bright, crunchy things on top.", leanRoles: ["base", "fat", "acid", "aromatic", "texture", "finish"], typicalComponents: ["The filling", "The wrap", "Salsa", "To top"] },
  { id: "sandwich", label: "Sandwich & toast", kicker: "SANDWICH / TOAST", blurb: "Built between or atop bread — layers that hold together and don't go soggy.", leanRoles: ["base", "fat", "salt", "acid", "texture", "finish"], typicalComponents: ["The bread", "The spread", "The filling", "To finish"] },
  { id: "curry", label: "Curry & stew", kicker: "CURRY / STEW", blurb: "A spiced, simmered sauce with something tender braised into it.", leanRoles: ["base", "aromatic", "heat", "fat", "umami", "salt"], typicalComponents: ["The sauce", "The protein", "Aromatic base", "To serve"] },
  { id: "flatbread", label: "Flatbread & pizza", kicker: "FLATBREAD / PIZZA", blurb: "A crisp base, a sauce or smear, and toppings that finish in a hot oven.", leanRoles: ["base", "fat", "umami", "salt", "aromatic", "finish"], typicalComponents: ["The base", "The sauce", "Toppings", "To finish"] },
  { id: "noodlesoup", label: "Noodle soup", kicker: "NOODLE SOUP", blurb: "A deep broth, noodles, and a pile of toppings layered into the bowl.", leanRoles: ["base", "umami", "salt", "aromatic", "fat", "finish"], typicalComponents: ["The broth", "The noodles", "Toppings", "To finish"] },
  { id: "grill", label: "Grill & skewers", kicker: "GRILL / SKEWERS", blurb: "Char and smoke over fire — a marinade going in, a sauce coming out.", leanRoles: ["base", "fat", "salt", "aromatic", "heat", "finish"], typicalComponents: ["The grill", "Marinade", "The sauce", "A fresh side"] },
  { id: "risotto", label: "Risotto & creamy grain", kicker: "RISOTTO / CREAMY GRAIN", blurb: "A starchy grain cooked slow and loose, enriched and finished off the heat.", leanRoles: ["base", "fat", "umami", "salt", "aromatic", "finish"], typicalComponents: ["The grain", "The stock", "To enrich", "To finish"] },
  { id: "raw", label: "Raw & crudo", kicker: "RAW / CRUDO", blurb: "Barely touched — pristine raw things dressed with acid, salt, and oil at the last second.", leanRoles: ["acid", "salt", "fat", "aromatic", "finish"], typicalComponents: ["The raw", "The dressing", "To finish"] },
  { id: "fried", label: "Fried & crispy", kicker: "FRIED / CRISPY", blurb: "A crackling crust around something tender, with a bright sauce to cut the fat.", leanRoles: ["base", "fat", "salt", "acid", "texture", "finish"], typicalComponents: ["The main", "The coating", "The sauce", "To finish"] },
];

export const ZERO_AXES: AxisMap = { salt: 0, sweet: 0, sour: 0, bitter: 0, umami: 0, fat: 0, heat: 0 };

// A "reaching for…" lens the cook can point the suggestions at — "I need a green /
// an acid / a crunch". Each maps to the data we already have: axes to reward, aroma
// keywords to match, an optional texture family / cold preference, and whether to
// dock fatty things (a green or fresh reach shouldn't surface oils). Deterministic.
export interface Reach {
  id: string;
  label: string;
  axes: Partial<AxisMap>;
  aromas: string[];
  family?: TextureFamily;
  cold?: boolean;
  penalizeFat?: boolean;
  kinds?: Kind[]; // food-groups that satisfy this reach (component reaches, not flavor)
  bareWhy: string; // "why" when the match is axis/texture/kind-only (no aroma names to cite)
}

export const REACHES: Reach[] = [
  // Flavor reaches — point at a taste/character move.
  { id: "acid", label: "Acid", axes: { sour: 1 }, aromas: ["citrus", "lemon", "lime", "tangy", "bright", "vinegar", "sour", "tart", "zesty", "pickled", "fermented"], bareWhy: "A bright, tangy lift, the way you're reaching." },
  { id: "green", label: "Green", axes: {}, aromas: ["grassy", "vegetal", "herbal", "green", "fresh", "leafy", "herbaceous", "pea", "cucumber", "verdant"], penalizeFat: true, bareWhy: "A fresh, green note, the way you're reaching." },
  { id: "crunch", label: "Crunch", axes: {}, aromas: [], family: "crunch", bareWhy: "A crisp, crunchy bite, the way you're reaching." },
  { id: "herb", label: "Herb", axes: {}, aromas: ["herbal", "herbaceous", "aromatic", "minty", "mint", "basil", "parsley", "cilantro", "coriander", "dill", "thyme", "oregano", "sage", "rosemary", "floral", "piney"], bareWhy: "A fresh herbal note, the way you're reaching." },
  { id: "heat", label: "Heat", axes: { heat: 1 }, aromas: ["spicy", "peppery", "chili", "pungent", "fiery", "hot", "warming"], bareWhy: "The heat you're reaching for." },
  { id: "rich", label: "Rich", axes: { fat: 1 }, aromas: ["buttery", "creamy", "nutty", "oily", "unctuous", "rich"], bareWhy: "The rounder richness you're reaching for." },
  { id: "fresh", label: "Fresh", axes: {}, aromas: ["fresh", "cool", "clean", "crisp", "bright", "mineral"], family: "fresh", cold: true, penalizeFat: true, bareWhy: "Something cool and fresh, the way you're reaching." },
  // Component reaches — point at a food-group the dish is missing. These are
  // flavor-quiet bodies the radar-driven ranking would never surface on its own.
  { id: "veg", label: "Veg", axes: {}, aromas: [], kinds: ["vegetable"], bareWhy: "A vegetable to build the dish out." },
  { id: "protein", label: "Protein", axes: {}, aromas: [], kinds: ["protein"], bareWhy: "A protein to anchor the dish." },
  { id: "starch", label: "Starch", axes: {}, aromas: [], kinds: ["grain"], bareWhy: "A starch to give the dish body." },
];
