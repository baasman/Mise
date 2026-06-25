import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeviceId } from "@/lib/identity";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const deviceId = await getDeviceId();
  const { id } = await params;
  // deleteMany scoped to the device — never delete another device's dish.
  await prisma.dish.deleteMany({ where: { id, deviceId } });
  return NextResponse.json({ ok: true });
}
