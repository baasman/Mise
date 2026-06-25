// Batch-profile the curated vocabulary into the pantry.
//
// For each ingredient name: derive a slug, skip if it already exists in the global
// pantry (deviceId null), otherwise ask Claude (Opus) for the full profile — 7 axes,
// aromas, texture, temperature, roles, novelty — and write it to the Ingredient table
// plus the FlavorEstimateCache (so the live "add your own" path benefits too).
//
// Idempotent + resumable: re-running skips everything already profiled.
// Concurrency-limited and per-item fault-tolerant.
//
// Run:  npm run profile-pantry            (all of VOCAB_NAMES)
//       npm run profile-pantry -- 25      (cap to the first 25 unprofiled — a cheap dry run)

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { estimateFlavor } from "../lib/anthropic";
import { VOCAB_CATEGORY, VOCAB_NAMES } from "../lib/pantry-vocabulary";

// tsx doesn't auto-load .env — pull ANTHROPIC_API_KEY (and anything else) in by hand.
function loadEnv() {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, "");
      if (!(key in process.env) || !process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env — rely on the ambient environment */
  }
}
loadEnv();

const prisma = new PrismaClient();
const CONCURRENCY = 5;
// Haiku by default for the bulk batch (≈10× cheaper); override with MISE_PROFILE_MODEL.
const MODEL = process.env.MISE_PROFILE_MODEL || "claude-haiku-4-5";

// Pace request STARTS to stay under the org's per-minute rate limit (Haiku tier is
// 50 rpm). Default 40/min for headroom (retries count too); override with MISE_PROFILE_RPM.
const RPM = parseInt(process.env.MISE_PROFILE_RPM || "40", 10);
const SPACING_MS = Math.ceil(60000 / RPM);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let nextSlot = Date.now();
async function acquireSlot() {
  const now = Date.now();
  const start = Math.max(now, nextSlot);
  nextSlot = start + SPACING_MS;
  const wait = start - now;
  if (wait > 0) await sleep(wait);
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function pool<T>(items: T[], n: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await worker(items[i++]);
    }),
  );
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set (looked in .env and the environment). Aborting.");
    process.exit(1);
  }

  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;

  // What's already in the global pantry?
  const existing = new Set(
    (await prisma.ingredient.findMany({ where: { deviceId: null }, select: { slug: true } })).map((r) => r.slug),
  );

  const todo = VOCAB_NAMES.filter((n) => !existing.has(slugify(n))).slice(0, limit);
  console.log(
    `Vocabulary: ${VOCAB_NAMES.length} names · already profiled: ${existing.size} · to profile now: ${todo.length}`,
  );
  if (!todo.length) {
    console.log("Nothing to do — pantry already covers the vocabulary.");
    return;
  }

  let created = 0;
  let failed = 0;
  let done = 0;
  const failures: string[] = [];

  await pool(todo, CONCURRENCY, async (name) => {
    const slug = slugify(name);
    const key = name.toLowerCase();
    try {
      await acquireSlot();
      const est = await estimateFlavor(name, VOCAB_CATEGORY[key], MODEL);
      await prisma.ingredient
        .create({
          data: {
            slug,
            deviceId: null,
            name,
            roles: est.roles,
            aromas: est.aromas,
            novelty: est.novelty,
            axes: est.axes as object,
            texture: est.texture,
            temperature: est.temperature,
            provenance: "estimate",
            source: "claude",
          },
        })
        .catch(() => {}); // ignore a race-created duplicate
      await prisma.flavorEstimateCache.upsert({
        where: { ingredientKey: key },
        update: {},
        create: {
          ingredientKey: key,
          axes: est.axes as object,
          aromas: est.aromas,
          texture: est.texture,
          temperature: est.temperature,
          roles: est.roles,
          novelty: est.novelty,
          model: MODEL,
        },
      });
      created++;
    } catch (e) {
      failed++;
      failures.push(name);
      console.warn(`  ✗ ${name}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      done++;
      if (done % 10 === 0 || done === todo.length) {
        console.log(`  …${done}/${todo.length} (created ${created}, failed ${failed})`);
      }
    }
  });

  const total = await prisma.ingredient.count({ where: { deviceId: null } });
  console.log(`\nDone. Created ${created}, failed ${failed}. Pantry now holds ${total} ingredients.`);
  if (failures.length) console.log(`Failed (re-run to retry): ${failures.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
