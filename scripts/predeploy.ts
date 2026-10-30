// Runs on Vercel before `next build` (wired via vercel.json buildCommand), so a
// deploy sets up its own database — no manual `prisma migrate deploy` / `npm run db:seed`.
//
// Guards keep it safe:
//   - no DATABASE_URL  → skip (a build without a DB still succeeds)
//   - preview deploy   → skip (don't mutate the production DB from a preview build)
// Applying migrations and seeding are both idempotent, so it's cheap to run every deploy.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

function skip(reason: string) {
  console.log(`[predeploy] ${reason} — skipping migrations + seed.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) skip("no DATABASE_URL");
if (process.env.VERCEL_ENV === "preview") skip("preview deploy");

const run = (cmd: string, env?: Record<string, string>) =>
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

// Migrations can't run over a pgbouncer pool. The Vercel Postgres / Neon
// integration injects an unpooled URL alongside the pooled DATABASE_URL — use it
// for schema changes if present, so the default integration setup works untouched
// while runtime still uses the pooled DATABASE_URL.
const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL!;

// The schema used to be synced with `prisma db push`, which leaves the tables
// but no migration history. prisma/migrations/0_init is exactly that schema, so
// a database in that state gets the baseline marked as applied (once) instead of
// re-running it; `migrate deploy` then applies everything after it.
async function needsBaseline(): Promise<boolean> {
  const prisma = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const [row] = await prisma.$queryRaw<{ history: boolean; tables: boolean }[]>`
      SELECT to_regclass('public."_prisma_migrations"') IS NOT NULL AS history,
             to_regclass('public."Ingredient"') IS NOT NULL AS tables`;
    return row.tables && !row.history;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (await needsBaseline()) {
    console.log("[predeploy] schema predates migrations — marking 0_init as applied…");
    run("prisma migrate resolve --applied 0_init", { DATABASE_URL: directUrl });
  }
  console.log("[predeploy] applying migrations (prisma migrate deploy)…");
  run("prisma migrate deploy", { DATABASE_URL: directUrl });
  console.log("[predeploy] seeding pantry (idempotent)…");
  run("tsx prisma/seed.ts");
  console.log("[predeploy] done.");
}

main().catch((e) => {
  console.error("[predeploy] failed", e);
  process.exit(1);
});
