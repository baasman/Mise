-- Ingredient.deviceId was meant for per-device custom ingredients, but custom
-- ingredients ended up inside dish snapshots and nothing ever wrote this column.
-- The pantry is now global only, keyed by slug.

BEGIN;

-- Remove any device-scoped rows first. They were never readable (the pantry
-- only served deviceId IS NULL), and keeping them would turn them into global
-- ingredients and could collide with a global slug under the new unique index.
DELETE FROM "Ingredient" WHERE "deviceId" IS NOT NULL;

-- The old unique index was on ("deviceId", slug), and Postgres treats NULLs as
-- distinct, so it never stopped two global rows from sharing a slug. Keep the
-- newest row per slug so the new unique index can be built; the seed, which runs
-- right after migrations on deploy, then brings that row in line with pantry.json.
DELETE FROM "Ingredient" a
USING "Ingredient" b
WHERE a.slug = b.slug
  AND (a."createdAt", a.id) < (b."createdAt", b.id);

-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_deviceId_fkey";

-- DropIndex
DROP INDEX "Ingredient_deviceId_idx";

-- DropIndex
DROP INDEX "Ingredient_deviceId_slug_key";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "deviceId";

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");

COMMIT;
