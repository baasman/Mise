// Seed the global pantry from prisma/pantry.json — the full 489-ingredient set
// (the 30 hand-authored + 459 Claude-profiled), exported so prod can be seeded
// deterministically without re-spending on Claude. Idempotent.
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

async function main() {
  const rows: PantryRow[] = JSON.parse(readFileSync(join(__dirname, "pantry.json"), "utf8"));

  // Skip if the pantry is already populated, so it's cheap to run on every deploy.
  const existing = await prisma.ingredient.count({ where: { deviceId: null } });
  if (existing >= rows.length) {
    console.log(`Pantry already seeded (${existing} ingredients) — skipping.`);
    return;
  }

  // Prisma can't target a null value inside a compound-unique `where`, so we
  // find-then-update/create by hand for the global (deviceId = null) pantry.
  for (const p of rows) {
    const fields = {
      name: p.name,
      roles: p.roles,
      aromas: p.aromas,
      novelty: p.novelty,
      axes: p.axes as object,
      texture: p.texture,
      temperature: p.temperature,
      provenance: p.provenance || "estimate",
      source: p.source || "seed",
    };
    const existing = await prisma.ingredient.findFirst({
      where: { deviceId: null, slug: p.slug },
      select: { id: true },
    });
    if (existing) {
      await prisma.ingredient.update({ where: { id: existing.id }, data: fields });
    } else {
      await prisma.ingredient.create({ data: { slug: p.slug, deviceId: null, ...fields } });
    }
  }
  const count = await prisma.ingredient.count({ where: { deviceId: null } });
  console.log(`Seeded pantry — ${count} global ingredients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
