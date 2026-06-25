// Runs on Vercel before `next build` (wired via vercel.json buildCommand), so a
// deploy sets up its own database — no manual `prisma db push` / `npm run db:seed`.
//
// Guards keep it safe:
//   - no DATABASE_URL  → skip (a build without a DB still succeeds)
//   - preview deploy   → skip (don't mutate the production DB from a preview build)
// Both the schema sync and the seed are idempotent, so it's cheap to run every deploy.
import { execSync } from "node:child_process";

function skip(reason: string) {
  console.log(`[predeploy] ${reason} — skipping schema + seed.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) skip("no DATABASE_URL");
if (process.env.VERCEL_ENV === "preview") skip("preview deploy");

const run = (cmd: string, env?: Record<string, string>) =>
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

// `prisma db push` can't run over a pgbouncer pool. The Vercel Postgres / Neon
// integration injects an unpooled URL alongside the pooled DATABASE_URL — use it
// for the push if present, so the default integration setup works untouched while
// runtime still uses the pooled DATABASE_URL.
const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL!;

console.log("[predeploy] syncing schema (prisma db push)…");
run("prisma db push --skip-generate", { DATABASE_URL: directUrl });
console.log("[predeploy] seeding pantry (idempotent)…");
run("tsx prisma/seed.ts");
console.log("[predeploy] done.");
