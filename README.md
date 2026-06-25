# Mise

A creative recipe **workspace** — _a sous-chef, not a vending machine_. You build a
dish ingredient by ingredient; the app reflects its flavor balance on a live radar
and offers optional, explained suggestions. There is no "generate dish" button, and
there never will be. You make every call.

Built from the `Mise.dc.html` Claude Design prototype: a pixel-faithful frontend plus
a thin, real backend for the three things the prototype left to "a real backend":
**flavor data, persistence, and culinary reasoning**.

## Architecture

- **Next.js (App Router) + TypeScript** — one app, client UI + API route handlers.
- **Postgres + Prisma** — anonymous device-scoped pantry, flavor-estimate cache, saved dishes.
- **Anthropic SDK (server-only)** — `claude-opus-4-8` estimates an off-pantry ingredient's
  7-axis flavor profile (cached, labeled `estimate`, the cook can override to `your read`);
  `claude-haiku-4-5` phrases the one-line suggestion "why". Ranking stays **deterministic**
  and client-side (`lib/engine.ts`) — Claude never generates the dish.

```
components/   UI: MiseWorkspace + Header/Reflection/Radar/Board/ComponentCard/
              IngredientRow/Suggestions + modals; useMise.ts (state hook)
lib/          domain.ts (pantry + constants), engine.ts (radar/flags/suggestions math),
              anthropic.ts, db.ts, identity.ts, api-client.ts, types.ts
app/api/      pantry · ingredients/estimate · suggestions/why · dishes (+ /[id])
prisma/       schema.prisma, seed.ts (loads the 30-ingredient pantry)
```

The flavor data is presented honestly as an **estimate**, not a measurement — a real
version would draw on a tasting panel or aroma-compound data (future research).

## Setup

```bash
npm install
cp .env.example .env          # set DATABASE_URL (and ANTHROPIC_API_KEY for AI features)
createdb mise                 # or point DATABASE_URL at any Postgres
npm run db:push               # create tables
npm run db:seed               # load the pantry
npm run dev                   # http://localhost:3000
```

`ANTHROPIC_API_KEY` is optional: without it, off-pantry ingredients stay `unprofiled`
and suggestion reasons use the local fallback — the app degrades gracefully.

## Scripts

| script             | what                                            |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | dev server                                      |
| `npm run build`    | production build                                |
| `npm test`         | engine unit tests (radar math, ranking, flags)  |
| `npm run db:push`  | sync schema to the database                     |
| `npm run db:seed`  | seed / re-seed the global pantry (from `prisma/pantry.json`) |

## Deploy (Vercel)

Vercel auto-detects Next.js; `prisma generate` runs via the `postinstall` script.
The build needs no database. Two steps beyond importing the repo:

**1. Add a Postgres + env vars** (Vercel → Storage → create Postgres, e.g. Neon):

| Variable            | Value                                             |
| ------------------- | ------------------------------------------------- |
| `DATABASE_URL`      | the pooled connection string (set by the integration) |
| `ANTHROPIC_API_KEY` | optional — enables flavor estimation + AI "why"   |

**2. Apply the schema and seed the pantry once** against the prod DB. Run locally
with the **direct** (unpooled) connection string — `db push` doesn't work over a
pgbouncer pool:

```bash
DATABASE_URL="<direct-prod-url>" npx prisma db push
DATABASE_URL="<direct-prod-url>" npm run db:seed   # loads all 489 ingredients
```

The pantry data ships in `prisma/pantry.json`, so seeding is deterministic and does
not call Claude. Saved dishes are anonymous + device-scoped (an httpOnly cookie), so
no auth is required. For higher traffic, keep `DATABASE_URL` on the pooled endpoint
(serverless connection limits) and use the direct URL only for `db push`.
