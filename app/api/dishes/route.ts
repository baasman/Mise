import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeviceId } from "@/lib/identity";
import type { DishSnapshot } from "@/lib/types";

interface DishRow {
  id: string;
  data: unknown;
  updatedAt: Date;
}

function toSaved(row: DishRow) {
  const snap = row.data as DishSnapshot;
  return { id: row.id, savedAt: row.updatedAt.getTime(), ...snap };
}

export async function GET() {
  const deviceId = await getDeviceId();
  const rows = await prisma.dish.findMany({
    where: { deviceId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(rows.map(toSaved));
}

export async function POST(req: Request) {
  const deviceId = await getDeviceId();
  const snap = (await req.json()) as DishSnapshot;
  const name = (snap.name || "").trim() || "Untitled dish";

  // Save-by-name upsert per device (mirrors the prototype).
  const existing = await prisma.dish.findUnique({
    where: { deviceId_name: { deviceId, name } },
    select: { id: true },
  });
  const fields = {
    name,
    intentId: snap.intentId,
    formId: snap.formId,
    customForm: (snap.customForm ?? undefined) as object | undefined,
    risk: snap.risk,
    method: snap.method,
    data: snap as unknown as object,
  };
  const row = existing
    ? await prisma.dish.update({ where: { id: existing.id }, data: fields })
    : await prisma.dish.create({ data: { deviceId, ...fields } });

  return NextResponse.json(toSaved(row));
}
