// The example dish — a hand-authored board the cook can load from the empty
// state to see how Mise works (radar, flags, components, magnitudes, amounts,
// suggestions) in ten seconds. Loading an example is not generating: it's a
// fixed, editorial starting point, fully editable and deletable like anything
// the cook builds. Every ingredient id is from the static seed PANTRY, which
// exists both in the database and in the offline fallback.
import type { DishSnapshot } from "./types";

export const EXAMPLE_DISH: DishSnapshot = {
  name: "Blistered tomatoes on toast",
  intentId: "bright_sharp",
  customIntent: null,
  formId: "sandwich",
  customForm: null,
  components: [
    { id: "c1", name: "The toast", notes: "" },
    { id: "c2", name: "The tomatoes", notes: "roast hot, until just collapsing" },
    { id: "c3", name: "To finish", notes: "" },
  ],
  committed: [
    { uid: 1, ingredientId: "sourdough", magnitude: "supporting", role: "base", componentId: "c1", amount: "2 thick slices" },
    { uid: 2, ingredientId: "olive_oil", magnitude: "trace", role: "fat", componentId: "c1", amount: "a good glug" },
    { uid: 3, ingredientId: "roasted_tomato", magnitude: "dominant", role: "base", componentId: "c2", amount: "a big handful, torn" },
    { uid: 4, ingredientId: "roasted_garlic", magnitude: "supporting", role: "aromatic", componentId: "c2", amount: "3–4 soft cloves" },
    { uid: 5, ingredientId: "smoked_paprika", magnitude: "trace", role: "aromatic", componentId: "c2", amount: "a pinch" },
    { uid: 6, ingredientId: "yogurt", magnitude: "supporting", role: "fat", componentId: "c3", amount: "a few spoonfuls" },
    { uid: 7, ingredientId: "mint", magnitude: "trace", role: "finish", componentId: "c3", amount: "a few leaves" },
    { uid: 8, ingredientId: "lemon_zest", magnitude: "trace", role: "acid", componentId: "c3", amount: "one lemon's worth" },
  ],
  customIngredients: [],
  activeComp: "c3",
  risk: 0.3,
  method:
    "Rub the hot toast with a soft garlic clove and the olive oil. Pile on the tomatoes, torn, with their juices. Spoon over the yogurt, then mint, lemon zest, and whatever the board talks you into.",
  servings: 2,
  cid: 4,
  uid: 9,
  custId: 1,
};
