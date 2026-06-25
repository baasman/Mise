// Seed the global pantry from the prototype's PANTRY array.
// Idempotent: re-running upserts the 30 seed ingredients (deviceId = null).
import { PrismaClient } from "@prisma/client";
import { PANTRY } from "../lib/domain";

const prisma = new PrismaClient();

async function main() {
  // Prisma can't target a null value inside a compound-unique `where`, so we
  // find-then-update/create by hand for the global (deviceId = null) pantry.
  for (const p of PANTRY) {
    const fields = {
      name: p.name,
      roles: p.roles,
      aromas: p.aromas,
      novelty: p.novelty,
      axes: p.axes,
      texture: p.texture,
      temperature: p.temperature,
      provenance: "estimate",
      source: "seed",
    };
    const existing = await prisma.ingredient.findFirst({
      where: { deviceId: null, slug: p.id },
      select: { id: true },
    });
    if (existing) {
      await prisma.ingredient.update({ where: { id: existing.id }, data: fields });
    } else {
      await prisma.ingredient.create({ data: { slug: p.id, deviceId: null, ...fields } });
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
