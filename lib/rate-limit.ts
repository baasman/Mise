// Fixed-window rate limiting backed by Postgres, so it needs no extra infra.
// Each (scope, subject, window) is one RateLimit row; the upsert maps to a
// native INSERT … ON CONFLICT, so concurrent hits count atomically.
//
// Limits key on the client IP rather than the device cookie: the cookie is
// free to discard, so a per-device limit would be trivial to sidestep.
import { prisma } from "./db";

export interface Limit {
  scope: string;
  max: number;
  windowMs: number;
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const LIMITS = {
  estimatePerIp: { scope: "estimate:ip", max: 20, windowMs: HOUR },
  whyPerIp: { scope: "why:ip", max: 120, windowMs: HOUR },
} satisfies Record<string, Limit>;

// Global ceiling on Opus estimate calls per UTC day — the backstop on spend.
export function estimateDailyCap(): Limit {
  const n = Number(process.env.ESTIMATE_DAILY_CAP);
  return { scope: "estimate:global", max: Number.isFinite(n) && n > 0 ? n : 500, windowMs: DAY };
}

export function windowKey(limit: Limit, subject: string, now: number): { key: string; expiresAt: Date } {
  const w = Math.floor(now / limit.windowMs);
  return { key: `${limit.scope}:${subject}:${w}`, expiresAt: new Date((w + 1) * limit.windowMs) };
}

// Vercel sets x-real-ip / x-forwarded-for itself (client values are overwritten).
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

// Count one hit; returns false once the window's budget is spent.
export async function hit(limit: Limit, subject: string, now = Date.now()): Promise<boolean> {
  const { key, expiresAt } = windowKey(limit, subject, now);
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  // Opportunistically sweep expired windows (~1% of hits) so the table stays small.
  if (Math.random() < 0.01) {
    prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }).catch(() => {});
  }
  return row.count <= limit.max;
}
