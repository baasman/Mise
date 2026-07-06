// Classic-pairings graph — established culinary combinations over the pantry's
// own vocabulary, generated once by scripts/build-pairings.ts (Claude batch,
// grounded in cooking tradition) and committed as prisma/pairings.json.
// Loaded here and symmetrized: pairing is mutual, and either side may have been
// the one to name it, so an edge in one direction counts for both (max strength
// wins). Runtime lookups are plain object reads — deterministic, no API.
import raw from "../prisma/pairings.json";

export type PairingMap = Record<string, Record<string, number>>;

let cache: PairingMap | null = null;

export function getPairings(): PairingMap {
  if (cache) return cache;
  // JSON imports type tuples as (string | number)[][] — the file's shape is ours.
  const file = raw as unknown as Record<string, [string, number][]>;
  const map: PairingMap = {};
  const add = (a: string, b: string, s: number) => {
    const row = (map[a] ||= {});
    if (!row[b] || row[b] < s) row[b] = s;
  };
  for (const [target, edges] of Object.entries(file)) {
    for (const [companion, strength] of edges) {
      add(target, companion, strength);
      add(companion, target, strength);
    }
  }
  cache = map;
  return map;
}
