// Seed the global pantry from prisma/pantry.json — the full 489-ingredient set
// (the 30 hand-authored + 459 Claude-profiled), exported so prod can be seeded
// deterministically without re-spending on Claude. Idempotent: applies only
// additions and edits.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { AxisMap, Role, Temperature, Texture } from "../lib/domain";

const prisma = new PrismaClient();

interface PantryRow {
  slug: string;
  name: string;
  roles: Role[];
  aromas: string[];
  novelty: number;
  axes: AxisMap;
  texture: Texture;
  temperature: Temperature;
  provenance: string;
  source: string;
}

// Exactly the fields the seed owns, in a fixed key order, so a row read back
// from the DB and a pantry.json entry compare equal when nothing changed.
function seedFields(p: Omit<PantryRow, "slug">) {
  return {
    name: p.name,
    roles: p.roles,
    aromas: p.aromas,
    novelty: p.novelty,
    axes: Object.fromEntries(Object.keys(p.axes).sort().map((k) => [k, p.axes[k as keyof AxisMap]])),
    texture: p.texture,
    temperature: p.temperature,
    provenance: p.provenance || "estimate",
    source: p.source || "seed",
  };
}

async function main() {
  const rows: PantryRow[] = JSON.parse(readFileSync(join(__dirname, "pantry.json"), "utf8"));

  // One read, then write only what's new or changed — cheap to run on every
  // deploy, and edits to pantry.json reach a populated DB. Ingredients dropped
  // from pantry.json are left in place: saved dishes may still reference them.
  const current = await prisma.ingredient.findMany({ where: { deviceId: null } });
  const bySlug = new Map(current.map((r) => [r.slug, r]));

  let created = 0;
  let updated = 0;
  for (const p of rows) {
    const fields = seedFields(p);
    const row = bySlug.get(p.slug);
    if (!row) {
      await prisma.ingredient.create({ data: { slug: p.slug, deviceId: null, ...fields } });
      created++;
    } else {
      const stored = seedFields({ ...row, axes: row.axes as AxisMap } as Omit<PantryRow, "slug">);
      if (JSON.stringify(stored) !== JSON.stringify(fields)) {
        await prisma.ingredient.update({ where: { id: row.id }, data: fields });
        updated++;
      }
    }
  }
  console.log(`Pantry: ${created} added, ${updated} updated, ${rows.length - created - updated} unchanged.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
