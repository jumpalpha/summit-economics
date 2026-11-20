import reviewJson from "./content/review.json";

/**
 * Public review bank: 12 practice questions per chapter, written from chapters.json.
 * Safe for games and practice pages. (Graded answer keys never live in the repo.)
 */
export type ReviewQ = { id: string; q: string; a: string; wrong: [string, string, string]; why: string };

export const review: Record<number, ReviewQ[]> = Object.fromEntries(
  Object.entries(reviewJson as unknown as Record<string, ReviewQ[]>).map(([n, qs]) => [Number(n), qs]),
);

/** All review questions for the given chapters, in chapter order. Unknown chapters are skipped. */
export function reviewFor(chapters: number[]): ReviewQ[] {
  return chapters.flatMap((n) => review[n] ?? []);
}

/** The four choices for a question, freshly shuffled (Fisher–Yates). Check a pick with `pick === q.a`. */
export function asChoices(q: ReviewQ): string[] {
  const c = [q.a, ...q.wrong];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}
