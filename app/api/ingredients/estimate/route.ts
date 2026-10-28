import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDeviceId } from "@/lib/identity";
import { readJson } from "@/lib/http";
import { LIMITS, clientIp, estimateDailyCap, hit } from "@/lib/rate-limit";
import { ApiKeyMissing, ESTIMATE_MODEL, estimateFlavor } from "@/lib/anthropic";
import type { AxisMap, Role } from "@/lib/domain";

const body = z.object({ name: z.string().min(1).max(80) });

const tooMany = () => NextResponse.json({ error: "too many requests" }, { status: 429 });

export async function POST(req: Request) {
  await getDeviceId();
  const json = await readJson(req, 1_000);
  if (!json.ok) return json.response;
  const parsed = body.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const name = parsed.data.name.trim();
  const key = name.toLowerCase();

  if (!(await hit(LIMITS.estimatePerIp, clientIp(req)))) return tooMany();

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

  // Only cache misses reach Claude, so only they spend the global daily budget.
  if (!(await hit(estimateDailyCap(), "all"))) return tooMany();

  try {
    const est = await estimateFlavor(name);
    const data = {
      axes: est.axes as object,
      aromas: est.aromas,
      texture: est.texture,
      temperature: est.temperature,
      roles: est.roles,
      novelty: est.novelty,
      model: ESTIMATE_MODEL,
    };
    // upsert: two concurrent misses for the same name both land here.
    await prisma.flavorEstimateCache.upsert({
      where: { ingredientKey: key },
      create: { ingredientKey: key, ...data },
      update: data,
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
