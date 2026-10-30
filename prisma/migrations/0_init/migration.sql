-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roles" TEXT[],
    "aromas" TEXT[],
    "novelty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "axes" JSONB NOT NULL,
    "texture" TEXT NOT NULL DEFAULT 'neutral',
    "temperature" TEXT NOT NULL DEFAULT 'room',
    "provenance" TEXT NOT NULL DEFAULT 'estimate',
    "source" TEXT NOT NULL DEFAULT 'seed',
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlavorEstimateCache" (
    "ingredientKey" TEXT NOT NULL,
    "axes" JSONB NOT NULL,
    "aromas" TEXT[],
    "texture" TEXT,
    "temperature" TEXT,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "novelty" DOUBLE PRECISION,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlavorEstimateCache_pkey" PRIMARY KEY ("ingredientKey")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intentId" TEXT,
    "formId" TEXT,
    "customForm" JSONB,
    "risk" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "method" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ingredient_deviceId_idx" ON "Ingredient"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_deviceId_slug_key" ON "Ingredient"("deviceId", "slug");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "Dish_deviceId_idx" ON "Dish"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Dish_deviceId_name_key" ON "Dish"("deviceId", "name");

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

