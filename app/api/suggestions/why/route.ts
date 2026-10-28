import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/identity";
import { readJson } from "@/lib/http";
import { LIMITS, clientIp, hit } from "@/lib/rate-limit";
import { MAX_WHY_BYTES, whyRequestSchema } from "@/lib/why-schema";
import { ApiKeyMissing, suggestionWhy } from "@/lib/anthropic";
import { AXES, ZERO_AXES, type AxisMap } from "@/lib/domain";

export async function POST(req: Request) {
  await getDeviceId();
  const json = await readJson(req, MAX_WHY_BYTES);
  if (!json.ok) return json.response;
  const parsed = whyRequestSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  // Over the limit the client just keeps its local buildWhy text.
  if (!(await hit(LIMITS.whyPerIp, clientIp(req)))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }
  const { board, candidates } = parsed.data;
  const low = { ...ZERO_AXES } as AxisMap;
  AXES.forEach((k) => {
    low[k] = board.low[k] ?? 0;
  });

  try {
    const why = await suggestionWhy(
      { intentLabel: board.intentLabel, low, aromas: board.aromas ?? [] },
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
