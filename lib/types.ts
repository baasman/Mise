// Mise — runtime state shapes (client-side). Mirror the prototype's `state`.
import type { AxisMap, Form, Magnitude, Role, Temperature, Texture } from "./domain";

// An ingredient as resolved by byId(): pantry item or a device's custom one.
export interface Ingredient {
  id: string;
  name: string;
  roles: Role[];
  aromas: string[];
  novelty: number;
  axes: AxisMap;
  texture: Texture;
  temperature: Temperature;
  custom?: boolean;
  // provenance from the server for custom/estimated items (else derived)
  unprofiled?: boolean;
  // true while a Claude flavor estimate is in flight for a just-added custom item
  estimating?: boolean;
}

// A named sub-assembly of the dish.
export interface Component {
  id: string;
  name: string;
  notes?: string;
}

// One committed ingredient on the board. axes/aromas, when present, are the
// cook's per-row overrides ("your read"); otherwise the ingredient's own values.
export interface CommittedRow {
  uid: number;
  ingredientId: string;
  magnitude: Magnitude;
  role: Role;
  componentId: string;
  axes?: AxisMap;
  aromas?: string[];
  texture?: Texture;
  temperature?: Temperature;
  amount?: string; // cook-entered amount for the recipe (free-text, e.g. "2 tbsp")
}

export interface Flag {
  id: string;
  kind: "intent" | "intrinsic";
  text: string;
}

export interface Suggestion {
  id: string;
  name: string;
  roleFill: string;
  why: string;
  riskText: string;
  riskColor: string;
  targetLabel: string;
  shared: string[]; // board aroma tags this candidate echoes (affinity)
  contrast: string; // a missing texture/temperature contrast it would add (or "")
  structure: string; // a role the direction leans on that it would fill (or "")
}

// A saved dish snapshot (matches the prototype's snapshot()).
export interface DishSnapshot {
  name: string;
  intentId: string | null;
  customIntent: AxisMap | null;
  formId: string | null;
  customForm: Form | null;
  components: Component[];
  committed: CommittedRow[];
  customIngredients: Ingredient[];
  activeComp: string | null;
  risk: number;
  method: string;
  servings: number;
  cid: number;
  uid: number;
  custId: number;
}
