"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Footprints } from "lucide-react";
import { allTasks, realmForChapter, realms } from "@/data/site";
import { useProgress } from "@/lib/progress";
import { LoginDialog } from "@/components/login";
import { ArtIcon } from "@/components/art-icon";

/** Welcome-back card: who you are, your trail rank, today's next step, XP bar. */
export function PlayerCard() {
  const { student, ready, stats, error } = useProgress();
  const [login, setLogin] = useState(false);
  const next = allTasks.find((t) => !stats.done.has(t.key));
  const chN = next ? next.key.match(/^ch(\d+[a-z]?)_/)?.[1] ?? "" : "";
  const here = chN ? realmForChapter(chN) : realms.find((r) => !stats.cleared.some((c) => c.n === r.n)) ?? realms[realms.length - 1];
  const pct = Math.round((stats.xp / Math.max(stats.maxXp, 1)) * 100);

  return (
    <div className="glass flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6" style={{ boxShadow: `0 20px 60px -30px ${here.color}` }}>
      <div className="relative grid size-24 shrink-0 place-items-center">
        <span className="absolute inset-3 rounded-full blur-xl" style={{ background: `color-mix(in srgb, ${here.color} 45%, transparent)` }} />
        <ArtIcon fallback={here.icon} size={96} className="relative" />
      </div>
      <div className="min-w-0 flex-1">
        {ready && student ? (
          <>
            <div className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {student.name}.</div>
            <div className="mt-1 text-sm font-semibold text-muted">
              <span className="text-gold">▲ {stats.rank.name}</span> · {stats.rank.flavor}
            </div>
          </>
        ) : (
          <>
            <div className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">You&apos;re at the trailhead.</div>
            <div className="mt-1 text-sm font-semibold text-muted">Log in to save XP, climb from Greenhorn to Summiteer, and earn unit badges.</div>
          </>
        )}
        {error && <div className="mt-1 text-sm font-semibold text-crimson">{error}</div>}
        <div className="mt-3 text-sm text-muted">
          <b className="text-fg">Today:</b>{" "}
          {next ? <Link href={next.href} className="font-semibold text-fg underline decoration-emerald/60 decoration-2 underline-offset-4 hover:decoration-emerald">{next.label}</Link> : "every task is done. You summited."}
          {" · "}<Link href="/survey/" className="font-semibold text-fg underline decoration-gold/60 decoration-2 underline-offset-4 hover:decoration-gold">Survey of the Day</Link> is open.
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs font-semibold">
            <span className="font-mono text-emerald">XP {stats.xp.toLocaleString()}</span>
            <span className="text-muted">{stats.next ? `Next rank: ${stats.next.name}` : "Max rank"}</span>
          </div>
          <div className="xp-bar"><div className="xp-fill" style={{ width: `${Math.max(pct, 1.5)}%` }} /></div>
        </div>
      </div>
      {ready && !student ? (
        <button onClick={() => setLogin(true)} className="btn-block btn-grass shrink-0 justify-center"><Footprints className="size-5" /> Log in / Join</button>
      ) : next ? (
        <Link href={next.href} className="btn-block btn-grass shrink-0 justify-center">Continue <ArrowRight className="size-5" /></Link>
      ) : null}
      {login && <LoginDialog onClose={() => setLogin(false)} />}
    </div>
  );
}
