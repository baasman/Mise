import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDeviceId } from "@/lib/identity";
import { ApiKeyMissing, estimateFlavor } from "@/lib/anthropic";
import type { AxisMap, Role } from "@/lib/domain";

const body = z.object({ name: z.string().min(1).max(80) });

export async function POST(req: Request) {
  await getDeviceId();
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const name = parsed.data.name.trim();
  const key = name.toLowerCase();

  const cached = await prisma.flavorEstimateCache.findUnique({ where: { ingredientKey: key } });
  if (cached) {
    return NextResponse.json({
      axes: cached.axes as AxisMap,
      aromas: cached.aromas,
      texture: cached.texture ?? "neutral",
      temperature: cached.temperature ?? "room",
      roles: (cached.roles.length ? cached.roles : ["finish"]) as Role[],
      novelty: cached.novelty ?? 0,
      provenance: "estimate",
    });
  }

  try {
    const est = await estimateFlavor(name);
    await prisma.flavorEstimateCache.create({
      data: {
        ingredientKey: key,
        axes: est.axes as object,
        aromas: est.aromas,
        texture: est.texture,
        temperature: est.temperature,
        roles: est.roles,
        novelty: est.novelty,
        model: "claude-opus-4-8",
      },
    });
    return NextResponse.json({
      axes: est.axes,
      aromas: est.aromas,
      texture: est.texture,
      temperature: est.temperature,
      roles: est.roles,
      novelty: est.novelty,
      provenance: "estimate",
    });
  } catch (e) {
    if (e instanceof ApiKeyMissing) {
      // No key configured — let the client fall back to "unprofiled".
      return NextResponse.json({ error: "estimation unavailable" }, { status: 503 });
    }
    console.error("[estimate] failed", e);
    return NextResponse.json({ error: "estimation failed" }, { status: 502 });
  }
}
