// Builds the POST /api/suggestions/why payload from the ranked suggestions.
// The client fetches only when this payload changes, so its JSON doubles as the
// refetch key: edits that don't change what Haiku would be told (amounts, notes,
// method, dish name) cost nothing.
import { AXES, type AxisMap, type Intent } from "./domain";
import { boardAromaWeights, type ById } from "./engine";
import type { CommittedRow, Suggestion } from "./types";

export interface WhyRequest {
  board: { intentLabel: string; low: AxisMap; aromas: string[] };
  candidates: {
    id: string;
    name: string;
    roles: string[];
    shared?: string[];
    contrast?: string;
    structure?: string;
    partners?: string[];
  }[];
}

// The endpoint takes at most 12 candidates; beyond that, cards keep local text.
const MAX_CANDIDATES = 12;

// Gap values are continuous (axis sliders); round so tiny drags don't refetch.
const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildWhyRequest(
  suggestions: Suggestion[],
  committed: CommittedRow[],
  byId: ById,
  intent: Intent,
  low: AxisMap,
): WhyRequest | null {
  const candidates = suggestions.slice(0, MAX_CANDIDATES).map((s) => ({
    id: s.id,
    name: s.name,
    roles: byId(s.id)?.roles ?? [],
    shared: s.shared,
    contrast: s.contrast,
    structure: s.structure,
    partners: s.partners?.slice(0, 3),
  }));
  if (!candidates.length) return null;
  const roundedLow = Object.fromEntries(AXES.map((k) => [k, round2(low[k])])) as AxisMap;
  return {
    board: {
      intentLabel: intent.label,
      low: roundedLow,
      aromas: Array.from(boardAromaWeights(committed, byId).keys()),
    },
    candidates,
  };
}
