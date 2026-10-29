# Cleanup plan

From the October 2026 review. Work lands directly on `main`, one commit per step.
Each step must pass `npx tsc --noEmit`, `npm test` and `npm run build`.

- [x] **1. Dependencies** — `next` 15.5.9 → 15.5.28; `npm audit fix`. Left: postcss (bundled in Next, build-time) and deepmerge-ts (Prisma CLI) — neither sees untrusted input; zod waits for step 8.
- [x] **2. Harden the AI routes**
  - [x] shared `readJson` helper → 400 on malformed JSON (estimate, why, dishes)
  - [x] bound every string/array in the `/why` schema (clipped, not rejected — big dishes legitimately send long lists)
  - [x] Postgres-backed rate limit (`RateLimit` table): estimate ~20/h, why ~120/h per device/IP; global daily Opus cap via `ESTIMATE_DAILY_CAP`; 429 when exceeded
  - [x] estimate cache write → `upsert`; store `ESTIMATE_MODEL`, not a literal
- [x] **3. Honest saves**
  - [x] failed save shows the server's error, not "Saved"
  - [x] dishes POST writes via `upsert`, unique-violation race → 409/retry
- [x] **4. "Why" correctness + render cost**
  - [x] compute suggestions once (`useMemo`), pass down
  - [x] `byId` backed by a `Map`
  - [x] refetch "why" on an ingredient/role/intent/form/risk/active-component signature, not every edit
  - [x] `AbortController` + request id so stale responses can't win
- [x] **5. Backend tidy**
  - [x] only write routes create a `Device`; cookie must be a UUID
  - [x] seed applies `pantry.json` edits to a populated DB
- [x] **6. Dead code + lint**
  - [x] remove `persistCustomIngredient` and the `custom: []` path (leave `Ingredient.deviceId` until a real migration)
  - [x] ESLint flat config + `npm run lint` in CI
  - [x] export: revoke the object URL after a tick
- [x] **7. Anthropic SDK upgrade** — 0.70 → 0.137 (latest 0.x); casts gone, requests verified byte-for-byte equivalent.
  - [x] _Follow-up:_ SDK 1.3 / API version `2026-10-21`. None of its breaking changes apply (no sampling params, documents, citations, Completions, or X-Api-Key proxy); request bodies verified unchanged. Live check: first estimate after deploy.
- [x] **8. zod 4** — no code changes needed; validation re-verified against the live routes. Remaining audit items are build-time only (postcss inside Next, deepmerge-ts inside the Prisma CLI).
- [ ] _Later:_ split `components/useMise.ts`
