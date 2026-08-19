/**
 * Query matching for the global search screen.
 *
 * Kept free of React and of any data imports so the ranking rules can be
 * tested directly rather than through a rendered screen.
 */

/** Normalises a query or a field for comparison. */
function norm(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Scores one candidate against a query. Higher is better; 0 means no match.
 *
 * Exact and prefix hits outrank substring hits so that typing "so" surfaces
 * SOL before Saga, rather than in whatever order the catalogue happens to be.
 */
export function scoreMatch(fields: readonly string[], query: string): number {
  const q = norm(query);
  if (!q) return 0;

  let best = 0;
  for (let i = 0; i < fields.length; i++) {
    const field = norm(fields[i]);
    if (!field) continue;
    // Earlier fields are more significant: symbol before name before blurb.
    const weight = fields.length - i;

    if (field === q) best = Math.max(best, 1000 * weight);
    else if (field.startsWith(q)) best = Math.max(best, 100 * weight);
    else if (field.includes(q)) best = Math.max(best, 10 * weight);
  }
  return best;
}

/**
 * Filters and ranks a list.
 *
 * @param fieldsOf returns the searchable fields for one item, most significant
 *                 first.
 */
export function search<T>(
  items: readonly T[],
  query: string,
  fieldsOf: (item: T) => readonly string[],
): T[] {
  if (!norm(query)) return [];

  const scored: { item: T; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const score = scoreMatch(fieldsOf(item), query);
    if (score > 0) scored.push({ item, score, index });
  });

  // Stable: equal scores keep their original catalogue order.
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((entry) => entry.item);
}
