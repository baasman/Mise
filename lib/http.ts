// Shared request helpers for the API routes. The client is anonymous, so every
// body is size-capped and parsed defensively: malformed JSON is a 400, not a 500.
import { NextResponse } from "next/server";

export type JsonResult = { ok: true; data: unknown } | { ok: false; response: NextResponse };

export async function readJson(req: Request, maxBytes: number): Promise<JsonResult> {
  const raw = await req.text();
  if (raw.length > maxBytes) {
    return { ok: false, response: NextResponse.json({ error: "request too large" }, { status: 413 }) };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "bad request" }, { status: 400 }) };
  }
}
