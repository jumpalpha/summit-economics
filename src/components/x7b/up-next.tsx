"use client";
// ── wave-x7b ── "Do these next" (twin of the Dopps Class checklist.html "Do these next" box and the
// Welcome screen's work list): the first unfinished required tasks, in course order, plus overall % done.
// Used on /welcome/ and on /quest/ (the parts of checklist.html the Quest checklist didn't have yet).
import Link from "next/link";
import { realms, requiredTasks, type Realm, type Task } from "@/data/site";
import { useProgress } from "@/lib/progress";
import { PRINT_CSS } from "@/components/x7b/print-css";

export type NextTask = Task & { realm: Realm };
export function nextTasks(done: Set<string>, n = 5): NextTask[] {
  const out: NextTask[] = [];
  for (const r of realms) for (const t of requiredTasks(r)) { if (out.length < n && !done.has(t.key)) out.push({ ...t, realm: r }); }
  return out;
}
export function requiredProgress(done: Set<string>) {
  const all = realms.flatMap(requiredTasks);
  const d = all.filter((t) => done.has(t.key)).length;
  return { done: d, total: all.length, pct: all.length ? Math.round((d * 100) / all.length) : 0 };
}

export function UpNextList({ items }: { items: NextTask[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t.key}>
          <Link href={t.href} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-gold/60">
            <span className="text-xl">{t.realm.icon}</span>
            <span className="min-w-0 flex-1"><b className="block leading-tight">{t.label}</b><span className="text-xs text-muted">Unit {t.realm.n}: {t.realm.name}{t.auto ? " · checks itself off when you pass" : " · tap Done on My Climb when finished"}</span></span>
            <span className="font-mono text-[10px] text-muted">25 XP</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The Quest page box: % done, what to do next, how the checklist works, and Print my progress. */
export function QuestUpNext() {
  const { stats, signedIn } = useProgress();
  const p = requiredProgress(stats.done);
  const items = nextTasks(stats.done, 4);
  return (
    <section className="block-panel p-5" data-testid="quest-up-next">
      <style>{PRINT_CSS + "@media print{ details.qx-how{display:none} }"}</style>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="pixel-title text-2xl">⭐ Do these next</h2>
          <p className="text-sm text-muted">{signedIn ? `${p.done} of ${p.total} required tasks done (${p.pct}%).` : "Log in to see what you've finished."}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button type="button" className="btn-block !text-sm" onClick={() => window.print()}>🖨 Print my progress</button>
          <Link href="/print-quest/" className="btn-block !text-sm">Blank paper sheet</Link>
        </div>
      </div>
      <div className="xp-bar mt-3 h-2.5"><div className="xp-fill h-full" style={{ width: `${p.pct}%` }} /></div>
      {items.length ? <div className="mt-4"><UpNextList items={items} /></div> : signedIn && <p className="mt-4 font-bold text-emerald">Every required task is done. Legendary! 💎</p>}
      <details className="qx-how mt-4 text-sm">
        <summary className="cursor-pointer font-bold text-muted">How does this checklist work?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li><b className="text-fg">Quizzes and unit tests check themselves off</b> when you pass them while logged in (chapter quiz 80%+, unit test 70%+).</li>
          <li><b className="text-fg">Reading and Think Like an Economist</b>: do the work, then tap <b className="text-fg">Done</b> next to the task below.</li>
          <li>Clear every task in a unit to earn its badge and climb a rank. Tap a task&apos;s name to go do it.</li>
        </ul>
      </details>
    </section>
  );
}
