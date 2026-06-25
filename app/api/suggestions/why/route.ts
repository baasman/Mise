import { NextResponse } from "next/server";
import { z } from "zod";
import { getDeviceId } from "@/lib/identity";
import { ApiKeyMissing, suggestionWhy } from "@/lib/anthropic";
import { AXES, ZERO_AXES, type AxisMap } from "@/lib/domain";

const body = z.object({
  board: z.object({
    intentLabel: z.string(),
    dishName: z.string(),
    low: z.record(z.string(), z.number()),
    aromas: z.array(z.string()).optional(),
  }),
  candidates: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        roles: z.array(z.string()),
        shared: z.array(z.string()).optional(),
        contrast: z.string().optional(),
        structure: z.string().optional(),
      }),
    )
    .max(12),
});

export async function POST(req: Request) {
  await getDeviceId();
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { board, candidates } = parsed.data;
  const low = { ...ZERO_AXES } as AxisMap;
  AXES.forEach((k) => {
    low[k] = board.low[k] ?? 0;
  });

  try {
    const why = await suggestionWhy(
      { intentLabel: board.intentLabel, dishName: board.dishName, low, aromas: board.aromas ?? [] },
      candidates,
    );
    return NextResponse.json({ why });
  } catch (e) {
    if (e instanceof ApiKeyMissing) {
      // No key — the client keeps its local buildWhy text.
      return NextResponse.json({ why: [] });
    }
    console.error("[why] failed", e);
    return NextResponse.json({ why: [] });
  }
}
