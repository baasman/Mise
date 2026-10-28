import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AxisMap, Role, Temperature, Texture } from "@/lib/domain";
import type { Ingredient } from "@/lib/types";

function toClient(row: {
  slug: string;
  name: string;
  roles: string[];
  aromas: string[];
  novelty: number;
  axes: unknown;
  texture: string;
  temperature: string;
  provenance: string;
  source: string;
}): Ingredient {
  return {
    id: row.slug,
    name: row.name,
    roles: row.roles as Role[],
    aromas: row.aromas,
    novelty: row.novelty,
    axes: row.axes as AxisMap,
    texture: row.texture as Texture,
    temperature: row.temperature as Temperature,
    custom: row.source !== "seed",
    unprofiled: row.provenance === "unprofiled",
  };
}

// Read from the DB on every request — never prerendered at build time (the
// build has no database, and the pantry can change with a re-seed).
export const dynamic = "force-dynamic";

export async function GET() {
  const global = await prisma.ingredient.findMany({
    where: { deviceId: null },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ pantry: global.map(toClient), custom: [] });
}
