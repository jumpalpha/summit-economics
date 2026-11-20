"use client";
// ── wave-learnA: chapter tools (port of Dopps Class quick_checks.js, chapter_path.js and checklist_track.js) ──
//   QuickCheck      up to 2 review.json questions after a section; a first-try miss goes into the Review Deck
//   QcNudge         friendly reminder above a section when the previous section's Quick Check is unanswered
//   ReadingTracker  a section counts as read after its end has been on screen and it was on screen 15+ seconds;
//                   also adds up reading time for the chapter
//   ChapterPath     the sidebar: read → Quick Checks → vocab games → chapter quiz → Think Like an Economist
//   VocabGameLinks  the 4 vocab game cards with this device's best scores
// Steps 1–3 are practice saved on this device (lib/learn-progress.ts). Steps 4–5 are the graded server tasks
// (ch<id>_quiz, ch<id>_tls) and are only read here, never written.
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, Check, Clock } from "lucide-react";
import { chapterById, chaptersIn, realmForChapter, type Chapter } from "@/data/site";
import type { ReviewQ } from "@/data/review";
import { quickChecksFor, vocabHref, vocabModes } from "@/data/learn";
import { PracticeQuestion } from "@/components/practice-question";
import { VOCAB_PASS, addReadingTime, answerQuickCheck, fmtTime, markSectionRead, readLearn, useLearn, type LearnState } from "@/lib/learn-progress";
import { useProgress } from "@/lib/progress";

const READ_SECONDS = 15;

// ── Quick Checks ──
export function QuickCheck({ chId, n, heading, qs, last }: { chId: string; n: number; heading: string; qs: ReviewQ[]; last: boolean }) {
  const { s, ready } = useLearn();
  const [picked, setPicked] = useState<Record<string, string>>({});
  if (!qs.length) return null;
  const answered = ready && qs.every((q) => s.qa[q.id]);
  return (
    <div id={`qc-${n}`} className="mt-6 scroll-mt-28 rounded-2xl border-2 p-4 sm:p-5" style={{ borderColor: "color-mix(in srgb, var(--color-sky) 45%, transparent)", background: "color-mix(in srgb, var(--color-sky) 7%, transparent)" }}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <b className="font-display text-lg text-sky">✅ Quick Check</b>
        <small className="text-xs font-bold text-muted">{answered ? "Done" : `${qs.length} question${qs.length > 1 ? "s" : ""} · about ${qs.length * 15} seconds`}</small>
      </div>
      <div className="space-y-5">
        {qs.map((q, i) => {
          const a = ready ? s.qa[q.id] : undefined;
          // After a reload we know the answer was given but not which wrong choice; show the right one.
          const p = picked[q.id] ?? (a ? (a[0] ? q.a : "") : null);
          return (
            <PracticeQuestion key={q.id} q={q} n={qs.length > 1 ? i + 1 : undefined} picked={p}
              onPick={(o) => { setPicked((x) => ({ ...x, [q.id]: o })); answerQuickCheck(q.id, o === q.a); }}
              extra={p != null && p !== q.a && picked[q.id] ? <i className="text-muted"> It&apos;s now in your <Link href={`/review/?ch=${chId}`} className="font-bold text-[var(--color-gold)] underline">Review Deck</Link> for practice.</i> : null} />
          );
        })}
      </div>
      {answered && <p className="mt-4 text-sm font-extrabold text-emerald">✓ Quick Check done{last ? ". Nice work!" : ": keep reading below."}</p>}
      <span className="sr-only">Quick Check for {heading}</span>
    </div>
  );
}

export function QcNudge({ n, qs }: { n: number; qs: ReviewQ[] }) {
  const { s, ready } = useLearn();
  if (!ready || !qs.length || qs.every((q) => s.qa[q.id])) return null;
  return (
    <div className="mb-5 rounded-xl border-l-4 border-gold p-3 text-sm font-bold" style={{ background: "color-mix(in srgb, var(--color-gold) 10%, transparent)" }}>
      💡 Don&apos;t skip the <a href={`#qc-${n}`} className="underline">Quick Check above</a>: {qs.length} question{qs.length > 1 ? "s" : ""}, about {qs.length * 15} seconds.
    </div>
  );
}

// ── Reading tracker ──
export function ReadingTracker({ chId, anchors }: { chId: string; anchors: string[] }) {
  useEffect(() => {
    const secs = anchors.map((a) => document.getElementById(a)).filter((e): e is HTMLElement => !!e);
    const onScreen = new Set<number>(), endSeen = new Set<number>();
    const seconds = secs.map(() => 0);
    const done = new Set(Object.keys(readLearn().reads[chId] ?? {}).map(Number));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const i = secs.indexOf(e.target as HTMLElement);
      if (i < 0) return;
      if (e.isIntersecting) onScreen.add(i); else onScreen.delete(i);
      // the section's bottom edge is above the bottom of the screen = scrolled to its end
      if (e.isIntersecting && e.boundingClientRect.bottom <= window.innerHeight + 4) endSeen.add(i);
    }), { threshold: [0, 0.25, 0.5, 0.75, 1] });
    secs.forEach((el) => io.observe(el));
    const onScroll = () => secs.forEach((el, i) => { if (onScreen.has(i) && el.getBoundingClientRect().bottom <= window.innerHeight + 4) endSeen.add(i); });
    window.addEventListener("scroll", onScroll, { passive: true });
    let pending = 0;
    const tick = setInterval(() => {
      if (document.hidden || !onScreen.size) return;
      pending++;
      onScreen.forEach((i) => { seconds[i]++; });
      secs.forEach((_, i) => {
        if (!done.has(i) && endSeen.has(i) && seconds[i] >= READ_SECONDS) { done.add(i); markSectionRead(chId, i); }
      });
      if (pending >= 5) { addReadingTime(chId, pending); pending = 0; }
    }, 1000);
    return () => { clearInterval(tick); io.disconnect(); window.removeEventListener("scroll", onScroll); if (pending) addReadingTime(chId, pending); };
  }, [chId, anchors]);
  return null;
}

// ── Chapter Path ──
type Step = { key: string; title: string; done: boolean; part: boolean; sub: string; act?: React.ReactNode; boss?: boolean };

/** Practice steps (saved on this device) for a chapter: read, Quick Checks, vocab. */
function localSteps(c: Chapter, s: LearnState) {
  const nSec = c.sections.length, read = Object.keys(s.reads[c.id] ?? {}).length;
  const qc = quickChecksFor(c).filter((l) => l.length), qcDone = qc.filter((l) => l.every((q) => s.qa[q.id])).length;
  const v = s.vocab[c.id] ?? {}, vDone = vocabModes.filter((m) => (v[m.id] ?? 0) >= VOCAB_PASS).length;
  return { nSec, read: Math.min(read, nSec), qcN: qc.length, qcDone, v, vDone };
}

export function ChapterPath({ chId }: { chId: string }) {
  const c = chapterById(chId)!;
  const { s, ready } = useLearn();
  const { signedIn, stats, state } = useProgress();
  const L = localSteps(c, s);
  const time = s.time[c.id] ?? 0;
  const missed = Object.keys(s.deck).filter((id) => quickChecksFor(c).some((l) => l.some((q) => q.id === id))).length;
  const quizDone = stats.done.has(`ch${c.id}_quiz`), tlsDone = stats.done.has(`ch${c.id}_tls`);
  const best = state?.best?.[`chapter${c.ref}`];
  const mastery = s.mastery[c.id];

  const steps: Step[] = [
    { key: "read", title: "Read every section", done: L.read >= L.nSec, part: L.read > 0,
      sub: L.read >= L.nSec ? `All ${L.nSec} sections read` : `${L.read} of ${L.nSec} read · scroll to the end of each, 15+ seconds`,
      act: <a href="#reading" className="font-extrabold text-sky hover:underline">Go to the reading ↓</a> },
    { key: "qc", title: "Answer each Quick Check", done: L.qcN > 0 && L.qcDone >= L.qcN, part: L.qcDone > 0,
      sub: L.qcN ? (L.qcDone >= L.qcN ? `All ${L.qcN} Quick Checks answered` : `${L.qcDone} of ${L.qcN} answered · they sit after the sections`) : "No Quick Checks in this chapter yet",
      act: missed ? <Link href={`/review/?ch=${c.id}`} className="font-extrabold text-sky hover:underline">Review {missed} missed question{missed === 1 ? "" : "s"} →</Link> : undefined },
    { key: "vocab", title: `Play all ${vocabModes.length} vocab games (${VOCAB_PASS}%+)`, done: L.vDone >= vocabModes.length, part: L.vDone > 0, sub: `${L.vDone} of ${vocabModes.length} done`,
      act: (
        <span className="flex flex-wrap gap-1.5">
          {vocabModes.map((m) => {
            const ok = (L.v[m.id] ?? 0) >= VOCAB_PASS;
            return <Link key={m.id} href={vocabHref(c, m.id)} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${ok ? "border-emerald/60 text-emerald" : "border-line text-fg hover:border-sky"}`}>{ok ? "✓ " : ""}{m.title}</Link>;
          })}
        </span>
      ) },
    { key: "quiz", title: "Pass the chapter quiz (80%+)", done: quizDone, part: best != null, boss: !quizDone,
      sub: quizDone ? `Passed${best != null ? ` · best ${best}%` : ""} · +25 XP` : signedIn ? (best != null ? `Best ${best}% · need 80%` : "20 questions, graded · +25 XP") : "Graded. Log in so it counts on My Climb.",
      act: !quizDone ? (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Link href={`/chapters/${c.id}/quiz/`} className="btn-block btn-grass !rounded-xl !px-3 !py-1.5 !text-xs">Take the quiz <ArrowRight className="size-3.5" /></Link>
          <Link href={`/mastery/?ch=${c.id}`} className="text-xs font-extrabold text-sky hover:underline">{mastery?.passed ? "✓ Mastery warm-up passed" : "Warm up: Mastery Check →"}</Link>
        </span>
      ) : undefined },
    { key: "tls", title: "Think Like an Economist", done: tlsDone, part: false,
      sub: tlsDone ? "Checked off · +25 XP" : signedIn ? "Answer it, then check it off · +25 XP" : "Log in to check it off on My Climb.",
      act: !tlsDone ? <a href="#think" className="font-extrabold text-sky hover:underline">Go to the challenge ↓</a> : undefined },
  ];
  const doneN = ready ? steps.filter((x) => x.done).length : 0;

  // Realm card: practice + graded steps across every chapter in this realm
  const r = realmForChapter(c.id);
  let tot = 0, got = 0;
  for (const rc of chaptersIn(r)) {
    const l = localSteps(rc, s);
    const ok = [l.read >= l.nSec, l.qcN > 0 && l.qcDone >= l.qcN, l.vDone >= 4, stats.done.has(`ch${rc.id}_quiz`), stats.done.has(`ch${rc.id}_tls`)];
    tot += ok.length; got += ok.filter(Boolean).length;
  }
  const pct = ready && tot ? Math.round((got * 100) / tot) : 0;

  return (
    <div className="space-y-4">
      <div id="path" className="glass scroll-mt-28 rounded-2xl p-5">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Your Chapter {c.label} Path</div>
        <div className="mt-1.5 text-sm text-muted"><b className="text-fg">{doneN} of {steps.length}</b> steps done{doneN === steps.length && <span className="font-extrabold text-emerald"> · Chapter complete! 🏆</span>}</div>
        <div className="xp-bar mt-2"><div className="xp-fill" style={{ width: `${(doneN / steps.length) * 100}%` }} /></div>
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-muted"><Clock className="size-3.5" /> Reading time: <span className="text-fg">{ready ? fmtTime(time) : "…"}</span></div>
        <ol className="mt-4 space-y-3.5">
          {steps.map((x) => {
            const d = ready && x.done, p = ready && !d && x.part;
            return (
              <li key={x.key} className="grid grid-cols-[24px_1fr] gap-2.5">
                <span className={`grid size-6 place-items-center rounded-full border-2 text-[11px] font-black ${d ? "border-emerald bg-emerald text-[#08130c]" : p ? "border-sky text-sky" : "border-line text-muted"}`}>
                  {d ? <Check className="size-3.5" strokeWidth={3.5} /> : p ? <span className="size-2 rounded-full bg-sky" /> : ""}
                </span>
                <div className="min-w-0">
                  <b className={`block text-sm leading-tight ${d ? "text-emerald" : ""}`}>{x.title}</b>
                  <small className="mt-0.5 block text-xs leading-snug text-muted">{ready ? x.sub : "…"}</small>
                  {x.act && <div className="mt-1.5 text-xs">{x.act}</div>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-[11px] leading-snug text-muted">Steps 1–3 check themselves off on this device. The quiz and Think Like an Economist count on My Climb.</p>
      </div>

      <div className="rounded-2xl border p-5 text-center" style={{ borderColor: `color-mix(in srgb, ${r.color} 35%, transparent)`, background: `linear-gradient(160deg, color-mix(in srgb, ${r.color} 16%, transparent), transparent)` }}>
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: r.color }}>{r.icon} Unit {r.n} badge</div>
        <div className="mt-1 font-display text-lg font-extrabold">{r.badge}</div>
        <div className="xp-bar mt-3"><div className="xp-fill" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-[11px] text-muted">{pct}% of this unit&apos;s chapter paths done ({ready ? got : 0} of {tot} steps)</p>
      </div>
    </div>
  );
}

export function VocabGameLinks({ chId }: { chId: string }) {
  const c = chapterById(chId)!;
  const { s, ready } = useLearn();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {vocabModes.map((m) => {
        const best = ready ? s.vocab[c.id]?.[m.id] : undefined;
        return (
          <Link key={m.id} href={vocabHref(c, m.id)} style={{ "--accent": m.color } as CSSProperties} className="accent-card group flex items-center gap-4 rounded-2xl p-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl transition-transform group-hover:-rotate-6 group-hover:scale-110" style={{ background: `color-mix(in srgb, ${m.color} 16%, transparent)` }} aria-hidden>{m.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{m.title}</span>
              <span className="block text-sm leading-snug text-muted">{m.desc}</span>
              <span className={`mt-1 block font-mono text-[11px] font-bold ${best != null && best >= VOCAB_PASS ? "text-emerald" : "text-muted"}`}>{best != null ? `${best >= VOCAB_PASS ? "✓ " : ""}Best ${best}%` : "Not played yet"}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-fg" />
          </Link>
        );
      })}
    </div>
  );
}

export function ReadingIntro({ count, qcCount }: { count: number; qcCount: number }) {
  return (
    <div className="mb-8 flex items-start gap-3 rounded-2xl border border-line p-4 text-sm text-muted">
      <BookOpen className="mt-0.5 size-5 shrink-0 text-gold" />
      <p><b className="text-fg">{count} sections, {qcCount} Quick Checks.</b> A section counts as read once you scroll to its end and it&apos;s been on screen for {READ_SECONDS}+ seconds. Your Chapter Path keeps score.</p>
    </div>
  );
}
