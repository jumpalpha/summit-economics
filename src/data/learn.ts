// ── wave-learnA: learning tools data (Vocab Engine, Quick Checks, Review Deck, Mastery, Search) ──
// Everything here is public practice content: glossary.json, chapters.json keyWords and review.json.
// Never import questions.json here (graded answer keys live only in the database).
import glossaryJson from "./content/glossary.json";
import reviewJson from "./content/review.json";
import { chapterById, chapters, type Chapter } from "./site";
import type { ReviewQ } from "./review";

export type Term = { t: string; d: string };
type G = { term: string; definition: string; chapter: number | string };
const glossary = glossaryJson as G[];
const byTerm = new Map(glossary.map((g) => [g.term.toLowerCase(), g]));

/** A chapter's vocabulary: its key words (looked up in the glossary, whichever chapter defined them first),
 *  then any other glossary words from this chapter. Key words with no definition are skipped. */
export function vocabFor(c: Chapter): Term[] {
  const out: Term[] = [];
  const seen = new Set<string>();
  const add = (g?: G) => { if (g && !seen.has(g.term)) { seen.add(g.term); out.push({ t: g.term, d: g.definition }); } };
  for (const k of c.keyWords) add(byTerm.get(k.toLowerCase().trim()));
  for (const g of glossary) if (String(g.chapter).toLowerCase() === c.id) add(g);
  return out;
}

/** The public review bank for a chapter, keyed by the chapter's string id ("5", "12a"). */
const reviewBank = reviewJson as unknown as Record<string, ReviewQ[]>;
export const reviewForChapter = (c: Chapter): ReviewQ[] => reviewBank[c.id] ?? [];
export const reviewQuestion = (id: string): (ReviewQ & { ch: Chapter }) | null => {
  for (const c of chapters) { const q = reviewForChapter(c).find((x) => x.id === id); if (q) return { ...q, ch: c }; }
  return null;
};
export const chaptersWithReview = () => chapters.filter((c) => reviewForChapter(c).length > 0);

// ── Quick Checks: up to 2 review.json questions after the section they come from ──
// Dopps Class writes 2 Quick Checks per lesson by hand. Bedrock's review bank is written per chapter, so each
// question is matched to the section whose text it shares the most rare words with (heading words count extra).
// A section holds at most 2; an overflow question moves to its next-best section when that one is a close match.
const STOP = new Set(("the a an and or of to in on is are was were be by for with as at from that this it its into than then which what who " +
  "how why when where your you they their them can not no do does did has have had more most only also about over under each one two three " +
  "all any some these those such other very like just will would could should may might there here because while both economy economic").split(" "));
const stem = (w: string) => w.replace(/ies$/, "y").replace(/(ing|ed|es|s)$/, "");
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem);

export const QC_PER_SECTION = 2;
/** Hand placements where the word match picks the wrong section: question id -> section heading. */
const QC_PLACE: Record<string, string> = {
  // (none yet)
};
const qcCache = new Map<string, ReviewQ[][]>();
/** For each section of the chapter (same order as c.sections), the Quick Check questions that go after it. */
export function quickChecksFor(c: Chapter): ReviewQ[][] {
  const hit = qcCache.get(c.id);
  if (hit) return hit;
  const secs = c.sections.map((s) => ({ head: new Set(tokens(s.heading)), body: new Set(tokens(s.heading + " " + s.markdown)) }));
  const df = new Map<string, number>();
  secs.forEach((s) => s.body.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const n = secs.length;
  const scored = reviewForChapter(c).map((q, order) => {
    const qt = new Set(tokens(`${q.q} ${q.a} ${q.why}`));
    const sc = secs.map((s) => {
      let v = 0;
      for (const t of qt) { if (s.body.has(t)) v += Math.log(1 + n / df.get(t)!); if (s.head.has(t)) v += 1; }
      return v;
    });
    const rank = sc.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
    return { q, order, rank };
  });
  const out: { q: ReviewQ; order: number }[][] = c.sections.map(() => []);
  const placed = scored.filter((s) => { const i = c.sections.findIndex((x) => x.heading === QC_PLACE[s.q.id]); if (i >= 0) out[i].push(s); return i >= 0; });
  for (const s of [...scored].filter((x) => !placed.includes(x)).sort((a, b) => b.rank[0][0] - a.rank[0][0])) {
    const [best] = s.rank;
    if (best[0] <= 0) continue;
    const spot = s.rank.find(([v, i]) => out[i].length < QC_PER_SECTION && (i === best[1] || v >= best[0] * 0.6));
    if (spot) out[spot[1]].push({ q: s.q, order: s.order });
  }
  const res = out.map((l) => l.sort((a, b) => a.order - b.order).map((x) => x.q));
  qcCache.set(c.id, res);
  return res;
}

// ── Vocab games ──
export const vocabModes = [
  { id: "flashcard", title: "Flashcard Flip", icon: "🃏", desc: "Flip each card, then be honest: got it or still learning?", color: "#38bdf8" },
  { id: "speedquiz", title: "Speed Quiz", icon: "⚡", desc: "Match the definition to the word before the 30-second timer runs out.", color: "#f6c453" },
  { id: "wordbuild", title: "Word Builder", icon: "🔤", desc: "Tap letter tiles to spell the word that fits the definition.", color: "#34d399" },
  // Concept Map needs big-idea groups per chapter in data/concept-map.ts; add it back here once those are written:
  // { id: "conceptmap", title: "Concept Map", icon: "🗺️", desc: "Pick what each word means, then the big idea it belongs to.", color: "#c084fc" },
] as const;
// "conceptmap" stays in the type so the Concept Map code keeps compiling while the mode is switched off.
export type VocabMode = (typeof vocabModes)[number]["id"] | "conceptmap";
export const vocabHref = (c: Chapter, mode: VocabMode = "flashcard") => `/vocab/?ch=${c.id}${mode === "flashcard" ? "" : "#" + mode}`;

export const chapterFromQuery = (v: string | null) => (v ? chapterById(v) : undefined) ?? chapters[0];
