import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeviceId } from "@/lib/identity";
import { MAX_DISH_BYTES, dishSnapshotSchema } from "@/lib/dish-schema";
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

  // The client is anonymous, so don't trust the body: cap the size, then
  // validate the shape (bounded strings/arrays; unknown keys are stripped).
  const raw = await req.text();
  if (raw.length > MAX_DISH_BYTES) {
    return NextResponse.json({ error: "dish too large" }, { status: 413 });
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const parsed = dishSnapshotSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const snap = parsed.data as DishSnapshot;
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
  if (!existing) {
    // Bound the library per device so an anonymous client can't hoard rows.
    const count = await prisma.dish.count({ where: { deviceId } });
    if (count >= 200) {
      return NextResponse.json({ error: "library full — delete a dish first" }, { status: 409 });
    }
  }
  const row = existing
    ? await prisma.dish.update({ where: { id: existing.id }, data: fields })
    : await prisma.dish.create({ data: { deviceId, ...fields } });

  return NextResponse.json(toSaved(row));
}
