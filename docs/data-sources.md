# Ingredient data sources for Mise

The pantry is the real limiter on testing the suggestion engine — 30 ingredients
can't exercise flavor-gap ranking. This is an analysis of where to get more, what's
legitimately usable, and how it plugs into what Mise already has.

## The key realization: split breadth from profiles

Mise needs this per ingredient: `name · roles · 7 taste axes (0–1) · aromas · novelty
· texture · temperature`. **No public dataset provides the 7 taste axes, texture, or
temperature** — those are subjective sensory profiles, not recorded anywhere at scale.

But Mise already has a profiler that emits exactly that shape: **`estimateFlavor`**
(`lib/anthropic.ts`, Opus) → cached in `FlavorEstimateCache`. So the problem is not
"find a dataset with the profiles." It's:

```
broad ingredient NAME list  →  Claude profiler (already built)  →  DB cache  →  pantry
        (datasets)                  (estimateFlavor)              (have it)
```

Datasets supply **names, categories, aroma descriptors, and pairings** — grounding that
makes Claude's estimates better and seeds a real *affinity* signal. They do **not** need
to supply the taste numbers.

## What's actually out there

| Source | What it gives | Size | License | Fit for Mise |
|---|---|---|---|---|
| **FlavorDB2** (IIIT-Delhi) | Ingredients + 34 categories + flavor *molecules* + descriptors | 936 ingredients / 25.6k molecules | **CC BY-NC-SA 3.0** (non-commercial) | **Best name + category vocabulary.** Per-ingredient JSON, parseable. |
| **Ahn flavor network** (2011, Nature Sci Rep) | Ingredient ↔ ingredient edges by *shared aroma compounds* | 381 ingredients / 1021 compounds | Academic suppl. data, widely reused | **Best open affinity/pairing source** (the real "Flavor Bible" job, P4). |
| **RecipeNLG / Recipe1M+** | Recipes → ingredient lists + clean `ner` food entities → **co-occurrence** | 1–2.2M recipes / ~1.5k ingredients | **Non-commercial research only** (binds employer) | Great empirical "what chefs combine"; license blocks shipping. |
| **The Flavor Bible** derivatives (brege/the-flavor-network, food-tools/flavor-map) | Chef-consensus pairings + some taste/weight/season tags | a few hundred | Repo code MIT; **source data is a copyrighted book** | Closest to chef intuition, **but legally risky** — see below. |
| **FooDB** | Food constituents / flavor compounds | huge | Open (non-commercial-ish) | Deeper compound data; overkill for now. |
| **TheMealDB / Spoonacular** | Ingredient lists via API | — | Free tier / paid API | Easy name lists, but shallow (no flavor structure). |

## The Flavor Bible, honestly

*The Flavor Bible* (Page & Dornenburg) is a **copyrighted book**. The GitHub projects that
"treat it as a dataset" (brege/the-flavor-network, food-tools/flavor-map) license their
*code* (MIT) but **cannot license the book's content** — the pairing tables are a
derivative of copyrighted material, and the repos are silent on source-data rights.

- Fine for **personal experimentation / learning**.
- **Risky to ship** in a product, especially commercially.
- The good news: its actual *function* — "what pairs with what" — is covered by the
  **open, citable alternatives** (Ahn flavor network for compound-sharing; recipe
  co-occurrence for empirical pairing). We don't need the book.

One honesty caveat carried from `docs/chef-methodology-analysis.md`: the shared-aroma-
compound pairing hypothesis is a **heuristic, not a law** (validated for some cuisines,
not others). Any affinity feature should be offered as an idea, with provenance — exactly
Mise's existing posture.

## Recommendation

**Step 1 — Breadth now (unblocks testing).** Build the pantry up to a few hundred
ingredients using a curated **name + category** vocabulary (FlavorDB2's 34 categories give
good coverage; ingredient *names* themselves aren't copyrightable), then batch-run the
existing `estimateFlavor` to fill the 7 axes / aromas / texture / temperature, writing to
the pantry + cache. Reuses infrastructure we already built; cost is a one-time batch of
Opus calls, cached forever. This is the highest-leverage move and directly fixes "the
engine has nothing to suggest."

**Step 2 — Affinity (the real Flavor-Bible value, P4).** Layer in the **Ahn flavor
network** shared-compound edges as an affinity score, blended with the existing
flavor-gap ranking, so suggestions reach for *what goes with what's already on the board*,
not just what closes an axis gap. Open and citable. Later, recipe co-occurrence can refine
it if Mise stays non-commercial.

**Licensing footing:** for a personal/experimental build, the non-commercial datasets are
fine to develop and test against. If Mise ever goes commercial, the safe stack is:
Claude-generated profiles (ours) + Ahn network (academic) + a self-collected or licensed
pairing set — and explicitly *not* Flavor-Bible-derived data.

## Sources
- [FlavorDB2 — IIIT-Delhi](https://cosylab.iiitd.edu.in/flavordb2/) · [paper (NAR)](https://academic.oup.com/nar/article/46/D1/D1210/4559748)
- [Flavor network and the principles of food pairing — Ahn et al., 2011](https://www.nature.com/articles/srep00196) · [data/code (Pepton21)](https://github.com/Pepton21/flavor-network) · [(lingcheng99)](https://github.com/lingcheng99/Flavor-Network)
- [RecipeNLG — HuggingFace](https://huggingface.co/datasets/mbien/recipe_nlg) · [Recipe1M+ — MIT](https://im2recipe.csail.mit.edu/)
- [brege/the-flavor-network](https://github.com/brege/the-flavor-network) · [food-tools/flavor-map](https://github.com/food-tools/flavor-map)
- [FlavorGraph (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7806805/)
