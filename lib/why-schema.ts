// Request validation for POST /api/suggestions/why. Every field ends up in the
// Haiku prompt, so every string and array is bounded — an anonymous client
// can't inflate the prompt or smuggle long instructions into it.
//
// Strings and lists are *clipped*, not rejected: a big dish legitimately has
// many partners / aroma notes, and a cook can type a long custom name, and the
// "why" should still work for them. The raw body is capped first (MAX_WHY_BYTES),
// so the work done before clipping is bounded too.
import { z } from "zod";
import { AXES } from "./domain";

const clip = (max: number) => z.string().transform((s) => s.slice(0, max));
const list = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).transform((a) => a.slice(0, max));
const gap = z
  .number()
  .finite()
  .transform((n) => Math.max(0, Math.min(1, n)))
  .optional();

export const whyRequestSchema = z.object({
  board: z.object({
    intentLabel: clip(80),
    low: z.object(Object.fromEntries(AXES.map((k) => [k, gap])) as Record<(typeof AXES)[number], typeof gap>),
    aromas: list(clip(40), 40).optional(),
  }),
  candidates: z
    .array(
      z.object({
        id: z.string().max(80),
        name: clip(80),
        roles: list(clip(20), 6),
        shared: list(clip(40), 6).optional(),
        contrast: clip(80).optional(),
        structure: clip(80).optional(),
        partners: list(clip(80), 3).optional(),
      }),
    )
    .max(12),
});

// Generous for 12 candidates on a big board; anything larger isn't our client.
export const MAX_WHY_BYTES = 64_000;
