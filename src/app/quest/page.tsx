"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { bonusBadges, ranks, realms, realmTasks, SIDE_QUESTS_PER_TERM, XP_PER_DAY, XP_PER_SIDE_QUEST, XP_PER_TASK } from "@/data/site";
import { useProgress } from "@/lib/progress";
import { dbReady } from "@/lib/db";
import { Eyebrow, PageHead } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { TaskList } from "@/components/task-list";
import { QuestUpNext } from "@/components/x7b/up-next";
import { SITE } from "@/data/config";

export default function Quest() {
  const { stats, state } = useProgress();
  const cleared = new Set(stats.cleared.map((r) => r.n));
  return (
    <>
      <PageHead eyebrow="My Climb" title="Climb your way to the summit"
        sub={`${XP_PER_TASK} XP per task, ${XP_PER_DAY} XP for every day you log in, ${XP_PER_SIDE_QUEST} XP per approved side quest. Clear a unit to climb a rank.`}>
        <div className="mt-8"><PlayerCard /></div>
      </PageHead>
      <div className="mx-auto max-w-7xl space-y-14 px-6 pt-12">
        {!dbReady && <p className="block-panel p-4 font-bold">Preview: saving progress turns on once the class database is connected.</p>}

        <section>
          <Eyebrow>Trail ranks</Eyebrow>
          <h2 className="pixel-title mb-5 text-3xl">Greenhorn to Summiteer</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
            {ranks.map((r, i) => {
              const got = i <= stats.rankIndex;
              return (
                <div key={r.name} className={`block-panel p-3 text-center ${got ? "" : "opacity-55"}`}>
                  <div className="mx-auto grid size-14 place-items-center rounded-xl border border-line bg-white/[0.04] font-display text-xl font-extrabold" style={{ color: realms[Math.max(0, i - 1)]?.color ?? "var(--color-sky)" }}>{"▲".repeat(Math.min(3, Math.ceil((i + 1) / 3)))}</div>
                  <div className="pixel-title mt-2 text-lg leading-tight">{r.name}</div>
                  <div className="mt-1 text-[11px] font-bold text-muted">{i === 0 ? "Start" : `${i} unit${i > 1 ? "s" : ""} cleared`}</div>
                  <div className="mt-1 text-[11px] italic text-muted">{r.flavor}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="badges" className="scroll-mt-24">
          <Eyebrow>Badges</Eyebrow>
          <h2 className="pixel-title mb-5 text-3xl">Unit badges</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {realms.map((r) => (
              <div key={r.n} className={`block-panel p-3 text-center ${cleared.has(r.n) ? "!border-emerald" : "opacity-60"}`}>
                <div className="text-3xl">{cleared.has(r.n) ? r.icon : <Lock className="mx-auto size-7 text-muted" />}</div>
                <div className="mt-1 text-sm font-extrabold leading-tight">{r.badge}</div>
                <div className="text-[11px] font-semibold text-muted">{r.name}</div>
              </div>
            ))}
          </div>
          <h3 className="pixel-title mb-4 mt-8 text-2xl">Bonus badges</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bonusBadges.map((b) => {
              const tracked = b.badge in stats.bonus, got = stats.bonus[b.badge];
              return (
                <div key={b.badge} className={`block-panel p-4 ${got ? "!border-emerald" : "opacity-70"}`}>
                  <div className="font-extrabold">{got ? "🏅" : "🔒"} {b.badge}</div>
                  <div className="text-sm text-muted">{b.earnedBy}{!tracked && ` (awarded by ${SITE.teacher})`}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <Eyebrow>Side quests this term</Eyebrow>
          <p className="font-bold">{stats.termApproved} of {SIDE_QUESTS_PER_TERM} required side quests approved{state?.term ? ` for ${state.term}` : ""}. <Link href="/side-quests/" className="underline">Pick one</Link></p>
        </section>

        <QuestUpNext />
        <section>
          <Eyebrow>Checklist</Eyebrow>
          <h2 className="pixel-title mb-5 text-3xl">Every task, every unit</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {realms.map((r) => (
              <div key={r.n} className="block-panel p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Link href={`/realms/${r.n}/`} className="pixel-title text-xl hover:underline">{r.icon} {r.n}. {r.name}</Link>
                  <span className="font-pixel text-[9px] text-muted">{realmTasks(r).filter((t) => stats.done.has(t.key)).length}/{realmTasks(r).length}</span>
                </div>
                <TaskList realm={r} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
