import chaptersJson from "./content/chapters.json";
import realmsJson from "./content/realms.json";
import themeJson from "./content/theme.json";

export type Section = { heading: string; markdown: string; part?: string };
// ── wave-sync: bonus chapters ("Chapter 12A") ──
// chapters.json: regular chapters have only `n`; a bonus chapter also has `id` ("12a") and `n` = the chapter it follows.
// Everything on the site keys chapters by `id` (URL /chapters/12a/, tasks ch12a_read…, questions.json key "12a").
// `ref` is the integer the database uses for quizzes and keys: 12 → 12, "12a" → 1201 (see scripts/sync/lib/parse.mjs).
type ChapterJson = {
  n: number; id?: string; realm: number; title: string; sections: Section[];
  thinkLikeAScientist: { prompt: string; standards: string }; checklist: string[]; keyWords: string[];
  /** Idaho content standards this chapter covers, e.g. ["9-12.EC.1"]. */
  standards?: string[];
};
export type Chapter = ChapterJson & { id: string; label: string; order: number; ref: number; bonus: boolean };
export const chapters: Chapter[] = (chaptersJson as unknown as ChapterJson[])
  .map((c) => {
    const id = c.id ?? String(c.n);
    const suffix = id.replace(/^\d+/, "");
    const k = suffix ? suffix.charCodeAt(0) - 96 : 0;
    return { ...c, id, label: id.toUpperCase(), order: c.n + k / 100, ref: k ? c.n * 100 + k : c.n, bonus: !!suffix };
  })
  .sort((a, b) => a.order - b.order);
export const chapterById = (id: string | number) => chapters.find((c) => c.id === String(id).toLowerCase());
/** Chapter for a database ref (12 or 1201). */
export const chapterByRef = (ref: number) => chapters.find((c) => c.ref === ref);
/** Stable section anchors (same slug rule as scripts/sync/lib/parse.mjs): "plate-tectonics", repeats get -2, -3… */
export function sectionAnchors(c: Chapter) {
  const seen = new Map<string, number>();
  return c.sections.map((s) => {
    const b = s.heading.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
    const k = (seen.get(b) ?? 0) + 1; seen.set(b, k);
    return k === 1 ? b : `${b}-${k}`;
  });
}
export const tlsKeyId = (c: Chapter) => `tls-${String(c.n).padStart(2, "0")}${c.id.replace(/^\d+/, "")}`;

// Trail look per unit ("realm" in the code): realms.json gives names and badges, this gives color, icon and terrain.
const biome: Record<number, { tex: string; color: string; icon: string; biome: string }> = {
  1: { tex: "foothills", color: "#84cc16", icon: "🥾", biome: "Foothills" },
  2: { tex: "meadow", color: "#f6c453", icon: "🌼", biome: "Alpine Meadow" },
  3: { tex: "forest", color: "#d08a4e", icon: "🪓", biome: "Pine Forest" },
  4: { tex: "river", color: "#22d3ee", icon: "🛶", biome: "River Valley" },
  5: { tex: "switchbacks", color: "#f28c28", icon: "🧗", biome: "Switchbacks" },
  6: { tex: "ridge", color: "#a78bfa", icon: "🔭", biome: "Ridgeline" },
  7: { tex: "ranger", color: "#34d399", icon: "🏕️", biome: "Ranger Station" },
  8: { tex: "peak", color: "#7dd3fc", icon: "🏔️", biome: "The Peak" },
};

export type Realm = {
  n: number; name: string; tagline: string; description: string; chapters: [number, number];
  badge: string; badgeEarnedBy: string; testTitle: string; tex: string; color: string; icon: string; biome: string;
};
export const realms: Realm[] = (realmsJson as unknown as Omit<Realm, "tex" | "color" | "icon" | "biome">[]).map((r) => ({ ...r, ...biome[r.n] }));
/** A chapter's realm comes from its own `realm` field (bonus chapters can sit in any realm). Accepts 5, "5" or "12a". */
export const realmForChapter = (id: number | string) => {
  const c = chapterById(id);
  return (c ? realms.find((r) => r.n === c.realm) : realms.find((r) => +id >= r.chapters[0] && +id <= r.chapters[1]))!;
};
export const chaptersIn = (r: Realm) => chapters.filter((c) => c.realm === r.n);
/** "Chapters 12–16" plus any bonus chapters ("12–16, 12A"). */
export const realmChapterLabel = (r: Realm) =>
  [`${r.chapters[0]}–${r.chapters[1]}`, ...chaptersIn(r).filter((c) => c.bonus).map((c) => c.label)].join(", ");

// ── XP: same rules as Dopps Class ──
export const XP_PER_TASK = 25;
export const XP_PER_DAY = 5;
export const XP_PER_SIDE_QUEST = 50;
export const SIDE_QUESTS_PER_TERM = 3;

/** Every unit's task list. A unit's badge (and the next trail rank) unlocks when all are done. */
/** bonus: earns XP and shows on the checklist, but is not needed to clear the realm (e.g. Classwork, which can be hidden). */
export type Task = { key: string; label: string; auto: boolean; href: string; bonus?: boolean };
export function realmTasks(r: Realm): Task[] {
  const t: Task[] = [];
  for (const c of chaptersIn(r)) {
    t.push({ key: `ch${c.id}_read`, label: `Read Chapter ${c.label}: ${c.title}`, auto: false, href: `/chapters/${c.id}/` });
    t.push({ key: `ch${c.id}_quiz`, label: `Pass the Chapter ${c.label} quiz (80%+)`, auto: true, href: `/chapters/${c.id}/quiz/` });
    t.push({ key: `ch${c.id}_tls`, label: `Think Like an Economist: Chapter ${c.label}`, auto: false, href: `/chapters/${c.id}/#think` });
  }
  t.push({ key: `unit${r.n}`, label: `${r.testTitle} (70%+)`, auto: true, href: `/tests/${r.n}/` });
  return t;
}
export const allTasks = realms.flatMap(realmTasks);
/** The tasks that must all be done to clear a realm (bonus tasks excluded). */
export const requiredTasks = (r: Realm) => realmTasks(r).filter((t) => !t.bonus);

export type Rank = { order: number; name: string; flavor: string };
/** 9 ranks: Greenhorn at the trailhead, one step per unit cleared, Summiteer for all eight (the Dopps Class model). */
export const ranks = (themeJson.ranks.list as { order: number; name: string; flavor: string }[]).map(({ order, name, flavor }) => ({ order, name, flavor }));
export const bonusBadges = themeJson.bonusBadges.list as { badge: string; earnedBy: string }[];
const rankTex = ["foothills", "meadow", "forest", "river", "switchbacks", "ridge", "ranger", "peak", "peak"];
export const rankTexture = (i: number) => rankTex[Math.min(i, rankTex.length - 1)];

export type Progress = {
  tasks: string[]; days: string[]; firstTry?: Record<string, number>; best?: Record<string, number>;
  sideQuests?: { id: string; term: string; approved: boolean }[]; term?: string;
  /** Realms the server has recorded as cleared (econ_cleared). Earned stays earned, even if tasks are added later. */
  cleared?: number[];
};
export function computeStats(p: Progress) {
  const done = new Set(p.tasks);
  const taskXp = allTasks.filter((t) => done.has(t.key)).length * XP_PER_TASK;
  // ── wave-sync: earned stays earned ──
  const recorded = new Set(p.cleared ?? []);
  /** Realms whose current task list is all done (the client claims these on the server, see lib/progress.ts). */
  const clearedNow = realms.filter((r) => requiredTasks(r).every((t) => done.has(t.key)));
  const cleared = realms.filter((r) => recorded.has(r.n) || clearedNow.includes(r));
  const approved = (p.sideQuests ?? []).filter((q) => q.approved);
  const gameXp = 0;
  const xp = taskXp + p.days.length * XP_PER_DAY + approved.length * XP_PER_SIDE_QUEST + gameXp;
  const rankIndex = Math.min(cleared.length, ranks.length - 1);
  const tlsDone = chapters.filter((c) => done.has(`ch${c.id}_tls`)).length;
  const bonus: Record<string, boolean> = {
    "Economist's Eye": tlsDone >= 10,
    "Perfect Score": Object.values(p.firstTry ?? {}).some((v) => v === 100),
    "Trail Volunteer": approved.length >= 1,
    "Summit Legend": cleared.length === realms.length,
  };
  const termApproved = approved.filter((q) => q.term === p.term).length;
  const maxXp = allTasks.length * XP_PER_TASK;
  return { xp, gameXp, maxXp, cleared, clearedNow, rank: ranks[rankIndex], next: ranks[rankIndex + 1] ?? null, rankIndex, bonus, termApproved, tlsDone, done };
}

export const daysOfYear = (d = new Date()) => Math.floor((+d - +new Date(d.getFullYear(), 0, 0)) / 864e5);
