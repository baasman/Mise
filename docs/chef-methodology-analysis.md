# How chefs devise dishes — and what it tells us about Mise

A serious look at the documented methodology of professional dish creation, mapped
against Mise's actual model, to find where the tool is well-grounded and where it
diverges from how chefs really work. Sources are listed at the end.

---

## Part 1 — How professional chefs devise dishes

Across culinary education, restaurant R&D (Noma, elBulli), and the canonical
balance frameworks, dish creation is remarkably consistent. It is **not** "pick
ingredients until it tastes good." It is a structured loop with a few load-bearing
principles.

### 1.1 The foundation: a flavor bank + mastered technique

Before any specific dish, chefs build two assets over years:

- **A "flavor bank"** — a deep internal library of tastes and which combinations
  work and why. "Taste everything you can, whether you like it or not." Breadth of
  remembered flavor is the raw material of creativity (Escoffier / Chef Vitelli).
- **Automatic technique** — fundamentals practiced until they're second nature, so
  creative attention isn't consumed by execution ("make gravlax weekly for a year").

### 1.2 The spark: where a dish starts

Dishes almost never start from "a flavor target." They start from a concrete
**anchor**, usually one of:

- **A hero ingredient** (the most common, especially seasonal, top-quality produce).
  The dish is *about* this one thing; everything else is built around it.
- **Memory / personal experience** ("cook your memory" — a childhood dish, a place).
- **A technique** (avant-garde, technique-first: the surprise is the point).
- **A constraint** — the season, locality, the occasion, cost, what's in the larder.

Seasonality recurs in every source as the dominant external driver.

### 1.3 Composition: build out from the hero, keep it tight

- **One dominant element, 3–4 total.** "Great dishes often contain merely 3–4
  components… one remains clearly dominant" while the rest *enhance* rather than
  overshadow it (Luxeat / Milor). Supporting parts have a job relative to the hero.
- **Respect the ingredient** — the supporting cast should make the hero's true
  flavor *more* itself, not bury it.

### 1.4 Balance: the functional levers (Salt · Fat · Acid · Heat)

Samin Nosrat's framework is the most widely taught model, and it's about
**functions, not quantities**:

- **Salt** — enhances/amplifies flavor across the board.
- **Fat** — carries flavor and creates texture (richness).
- **Acid** — *balances* richness; the "mouthwatering smack" that keeps a rich dish
  from being cloying. Correction rule: too rich → add acid.
- **Heat** — determines **texture** (cooking heat), distinct from chili "spice."

Layered on top, chefs balance the broader taste axes (sweet, bitter, umami too) by
one of four moves: **complementarity, contrast, harmony, or modulation**
(suppressing or enhancing one taste with another). Key idea: a dish has internal
**tensions** — rich wants acid to cut it; sweet wants salt/acid so it doesn't cloy.

### 1.5 The other half of the dish: texture, temperature, aroma, color

This is the part amateurs miss and chefs obsess over. "Behind every memorable bite
is a carefully orchestrated balance of **temperature, texture, acidity, salt, sugar,
and fat**." **Contrast** is a deliberate tool, not an accident:

- **Texture**: creamy + crunchy + tender + crisp in one bite.
- **Temperature**: hot/cold contrast within a plate.
- **Aroma**: shared or contrasting aromatic compounds (the smell *is* most of flavor).
- **Color / plating**: visual contrast and composition.

The 7-layer and "gastronomic variables" frameworks formalize this as a
**multisensory** design problem, not a taste-only one.

### 1.6 Pairing logic: complementary vs. contrasting (and a caveat)

Chefs reach for the next ingredient via two modes:

- **Complementary** — ingredients that share aroma compounds or reinforce each
  other (the basis of *The Flavor Bible* and the Foodpairing® graph of shared
  compounds).
- **Contrasting / balancing** — opposing qualities placed next to each other.

Important honesty caveat: the "shared-aroma-compounds → good pairing" hypothesis was
popular in the 2000s and holds for some cuisines (North American, Western European,
Latin American) but **not universally** (Korean, Southern European cuisines deviate).
It's a heuristic, not a law — which is relevant to how confidently a tool should assert
pairings.

### 1.7 Iterate relentlessly, taste constantly

- **Taste at every stage** — "the food is always going to tell you what it wants you
  to do with it." Adjust as you go.
- **Massive iteration** — Noma's "sawn-off shotgun": 20–30 variations a day, ~1% of
  ideas survive a tasting, and survivors get ~100 trials to dial in. elBulli's "El
  Taller" ran constant structured R&D with feedback rounds.
- **Test on real eaters** — a 4–5 day feature run; rework or kill.

### 1.8 Refine to restraint — know when to stop

The single most-repeated principle: a finished dish **resists adding or removing
anything**. The skill is "knowing the point at which to refrain." Subtraction is a
discipline ("remove one accessory"). Creativity is bounded by real constraints —
season, cost, kitchen capacity, consistency.

### Synthesis — the chef's loop

```
flavor bank + technique
      │
   SPARK  (hero ingredient · memory · technique · season/constraint)
      │
   COMPOSE  (build around ONE dominant element; 3–4 parts; each earns its place)
      │
   BALANCE  (salt enhances · acid cuts richness · fat carries · heat = texture;
             resolve internal tensions; complement OR contrast)
      │
   LAYER    (texture · temperature · aroma · color — contrast on purpose)
      │
   TASTE → ITERATE  (constant tasting; many trials; the food tells you)
      │
   REFINE → RESTRAIN  (nothing to add, nothing to remove; stop)
```

---

## Part 2 — Mise's methodology, as built

- **Intent** — a flavor aim (1 of 4) that sets a target vector on 7 taste axes;
  drives the dashed radar overlay and dismissible flags.
- **Direction / form** — structural shape (roast, pasta, salad…) that frames which
  *roles* a dish leans on and offers ghost-component scaffolds. (Structural
  *suggestions* were removed as truisms.)
- **Components** — named sub-assemblies; the dish is a set of them.
- **Ingredients** — each has a **role** (job), a coarse **magnitude**
  (trace/supporting/dominant), **7 taste-axis values** (salt, sweet, sour, bitter,
  umami, fat/rich, heat), **aroma tags**, and a **provenance** (estimate / your read /
  unprofiled).
- **Radar** — 7 taste axes, saturating aggregation `1 − e^(−0.6·Σ)`. **Reflection
  only — never a score.**
- **Suggestions** — deterministic **flavor-gap** ranking vs. the intent target +
  **risk dial** (novelty), always ≥1 off-script pick; Claude phrases the one-line "why."
- **Method** free-text + per-component notes; **saved library**; open pantry with
  Claude **flavor estimates** for off-pantry items.
- **Philosophy** — no "generate" button; the cook decides; reflect, never score;
  honest about what the data is.

---

## Part 3 — Side-by-side: chef methodology vs. Mise

| Chef concept | Mise support | Gap / implication |
|---|---|---|
| Flavor bank (what-goes-with-what) | **Partial** — pantry + aroma tags exist, but tags are unused in ranking | No model of *affinity* between ingredients |
| Spark = hero ingredient / memory / season | **Weak** — starts from intent + direction pickers; no ingredient-first on-ramp, no seasonality | Missing the most common real starting point |
| One dominant element, 3–4 parts, each earns its place | **Partial** — magnitude (trace/supp/dominant) + roles, but no first-class **hero** | Can't reason "this would overshadow the hero" |
| Salt enhances / acid cuts richness / fat carries (functional levers) | **Partial** — axes exist but are treated symmetrically and independently | No relationship-aware balance ("rich, no acid to cut it") |
| Internal tensions / intrinsic balance | **Absent** — flags fire only vs. the *intent target* | A dish can be out of balance regardless of your aim; Mise won't say so |
| Texture · temperature · aroma · color contrast | **Mostly absent** — radar is taste-only; aromas cosmetic | The biggest documented dimension of real dishes is invisible |
| Heat = cooking technique → texture | **Conflated** — "heat" means chili spice only | Technique/order-of-operations is just free-text |
| Complementary vs. contrasting pairing | **Partial** — risk dial ≈ safe↔novel; ranking is gap-fill only | No "what goes with what's already on the board" |
| Taste constantly · iterate · many trials | **Weak** — saves snapshots, no versions, no tasting log | No R&D loop; can't see a dish evolve |
| Refine to restraint (nothing to add/remove) | **Absent** — a feed that always offers *more* | Tool biases toward addition; chefs prize subtraction |
| Reflect, don't score; instinct over recipes | **Strong** ✓ | Matches Nosrat's "principles over recipes" exactly |
| No generate button; cook authors | **Strong** ✓ | Matches the literature: creativity is the chef's |
| Honesty about contested pairing science | **Strong** ✓ | Provenance labeling is well-judged |

---

## Part 4 — Where Mise is already right (don't change)

1. **Reflection, not score.** This is the Nosrat thesis — understand principles,
   trust instinct, don't optimize a number. Keep it.
2. **No generate button / cook authors every move.** Every source frames creativity
   as the chef's; a tool that "designs the dish" would be the anti-pattern.
3. **The 7-axis taste model is principled.** It is Salt/Fat/Acid/Heat (Nosrat) plus
   sweet/bitter/umami — a defensible superset, not an arbitrary choice.
4. **Risk dial (precedented ↔ novel).** A real axis: safe complementary pairings vs.
   Noma-style experimentation. Could even be expanded.
5. **Provenance honesty.** Pairing/flavor data is genuinely contested; not asserting
   false authority is the correct posture.

---

## Part 5 — Gaps → prioritized improvements

Ordered by leverage (impact × fit with Mise's philosophy × cost).

### P1 — Add a texture / temperature / contrast dimension *(biggest miss, biggest differentiator)*
The literature's loudest point is that a dish is **taste + texture + temperature +
aroma**, and that **contrast** is engineered on purpose. Mise reflects only taste.
- **Move:** a coarse `texture` + `temperature` tag per ingredient (e.g.
  crunchy/creamy/tender/crisp/juicy; hot/room/cold), and a second small reflection —
  a **"contrast" readout** beside the radar: *do you have crunch? something cool?
  something to cut the richness?* Keep it reflective, never a score.
- **Why it fits:** it's still "reflect what's on the board," it's cheap (tags), and it
  closes the gap every chef source flags. This is where Mise could be *uniquely* good.

### P2 — Relationship-aware / intrinsic-balance flags *(makes the sous-chef feel real)*
Today flags only fire against the arbitrary **intent target** ("umami low vs your
aim"). Chefs also correct **intrinsic** imbalance regardless of aim. Encode Nosrat's
actual correction heuristics:
- *"Lots of richness, little acid to cut it."* · *"Very salty, nothing sweet or fat to
  round it."* · *"Sweet-forward with no acid or salt to balance it."*
- **Move:** add an `intrinsic` flag kind computed from axis *relationships* (fat↔acid,
  salt↔sweet, etc.), shown alongside the existing `intent` flags, still dismissible.
- **Why it fits:** turns flags from "you're off your target" into "here's a tension a
  cook would notice" — the difference between a metric and a sous-chef.

### P3 — Hero element + a restraint signal *(honor "build around one thing" + "know when to stop")*
- **Hero:** let the cook designate a hero ingredient or component; suggestions and
  flags reason relative to it ("this would overshadow your hero"). Reinforces the
  3–4-elements-one-dominant structure.
- **Restraint:** a gentle reflection — element count, or *"your last few additions
  barely moved the shape"* — to counter the feed's natural bias toward *more*. The
  most-repeated chef principle is subtraction; Mise currently only ever adds.

### P4 — Affinity-aware suggestions *(the real-backend opportunity)*
Suggestions are pure gap-fill toward the intent. Chefs reach for the next ingredient
by **affinity to what's already there** (shared aroma family, classic pairing).
- **Move:** blend the existing flavor-gap score with an **affinity score** — start
  with the aroma tags already in the data (shared families), later a real
  pairing source / Claude reasoning. Honor the earlier "no truisms" lesson: only
  surface affinity when it's specific, and keep provenance honest (pairing is a
  heuristic, not a law).

### P5 — Ingredient-first on-ramp + seasonality *(match the real spark)*
- **On-ramp:** *"Start with a hero ingredient"* → frame supporting roles around it,
  as an alternative to the intent/direction-first flow.
- **Seasonality:** a `season` field on the pantry (cheap, high-signal). Every source
  names season as the dominant external driver; surfacing it ("in season now") is a
  small change with strong culinary credibility.

### P6 — Dish versioning + tasting log *(mirror the R&D loop)*
Chefs iterate massively and taste-correct. Mise saves a snapshot but has no sense of
a dish *evolving*.
- **Move:** versions of the same dish (v1/v2…) and a short **tasting note** per
  trial ("too sweet — pulled the honey"). It records the *cook's* judgment; it never
  judges for them — fully on-philosophy, and it's the digital "R&D log."

### Smaller calls
- Split **heat-the-taste (spice)** from **heat-the-technique (cooking method → texture)**;
  a per-component technique tag (raw/roasted/braised/fried/cured) feeds both texture (P1)
  and method.
- Acknowledge **salt and acid as corrective levers** (disproportionately important for
  "deliciousness") in the flag wording, rather than treating all 7 axes as equal.

---

## Sources

- [Inside a Chef's Mind — Escoffier](https://www.escoffier.edu/blog/recipes/inside-a-chefs-mind-the-process-behind-creating-new-dishes/)
- [Creative Methodology — Noma](https://noma.dk/creative-methodology/)
- [How to succeed at menu R&D — Restaurant Business](https://www.restaurantbusinessonline.com/food/how-succeed-menu-rd)
- [A theory of the creation of a dish — Luxeat](https://luxeat.com/blog/a-theory-of-the-creation-of-a-dish/)
- [Salt, Fat, Acid, Heat — Samin Nosrat (Splendid Table)](https://www.splendidtable.org/story/2017/05/05/samin-nosrat-on-mastering-salt-fat-acid-and-heat) · [publisher page](https://www.simonandschuster.com/books/Salt-Fat-Acid-Heat/Samin-Nosrat/9781476753836)
- [What Is Contrast in Food? — Savory Kitchin](https://savorykitchin.com/contrast-and-surprise/)
- [The 7-Layer Flavor Model — Medium](https://medium.com/@a.ozseven/the-7-layer-flavor-model-engineering-multi-dimensional-taste-experiences-c760994ec9f7)
- [Gastronomic Variables: A Framework for Design — Taylor & Francis](https://www.tandfonline.com/doi/pdf/10.1080/15428052.2025.2550432)
- [Why do Flavors Pair Well? — Institute of Culinary Education](https://www.ice.edu/blog/why-do-flavors-pair-well)
- [The Science of Flavor Pairing — Marky's](https://www.markys.com/blog/the-science-of-flavor-pairing-why-certain-foods-taste-better-together)
- [Food pairing — Wikipedia](https://en.wikipedia.org/wiki/Food_pairing)
- [Plating 101: Contrast and Balance — Johnson & Wales](https://www.jwu.edu/news/2017/04/plating-101-contrast-and-balance-in-food-presentation.html)
- [Menu Development — getmeez](https://www.getmeez.com/blog/menu-development-executive-chef)
