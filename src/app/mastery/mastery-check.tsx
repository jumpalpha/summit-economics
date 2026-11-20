"use client";
// ── wave-learnA: Mastery Checks (port of Dopps Class mastery.html) ──
// Dopps Class grades Mastery on the server (mastery_start / mastery_answer RPCs) because a pass there is worth
// +50 Verified XP. Summit's XP comes only from its graded quiz/test/TLS tasks, so Summit's Mastery Check is
// untracked practice: 10 questions from the chapter's public review bank (review.json), 8 right passes,
// checked in the browser and remembered on this device only. It never changes XP or grades.
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { chapterById, realmForChapter, type Chapter } from "@/data/site";
import type { ReviewQ } from "@/data/review";
import { chaptersWithReview, reviewForChapter } from "@/data/learn";
import { MASTERY_PASS, saveMastery, useLearn } from "@/lib/learn-progress";
import { PracticeQuestion } from "@/components/practice-question";

const TOTAL = 10;
const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export function MasteryCheck() {
  const { s, ready } = useLearn();
  const [want, setWant] = useState<string | null>(null);
  const [run, setRun] = useState<{ ch: Chapter; qs: ReviewQ[]; i: number; marks: boolean[]; picked: string | null } | null>(null);
  const [result, setResult] = useState<{ ch: Chapter; score: number } | null>(null);
  const list = chaptersWithReview();

  useEffect(() => {
    const c = chapterById(new URLSearchParams(location.search).get("ch") ?? "");
    if (c) { setWant(c.id); setTimeout(() => document.getElementById(`m-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150); }
  }, []);

  const start = (ch: Chapter) => {
    setResult(null);
    setRun({ ch, qs: shuffle(reviewForChapter(ch)).slice(0, TOTAL), i: 0, marks: [], picked: null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pick = (o: string) => run && setRun({ ...run, picked: o, marks: [...run.marks, o === run.qs[run.i].a] });
  const next = () => {
    if (!run) return;
    if (run.i + 1 < run.qs.length) { setRun({ ...run, i: run.i + 1, picked: null }); return; }
    const score = run.marks.filter(Boolean).length;
    saveMastery(run.ch.id, score);
    setResult({ ch: run.ch, score }); setRun(null);
  };

  if (run) {
    const q = run.qs[run.i];
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6" style={{ "--accent": realmForChapter(run.ch.id).color } as CSSProperties}>
        <div className="block-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold">Chapter {run.ch.label} · Question {run.i + 1} of {run.qs.length}</h2>
            <div className="flex gap-1.5" aria-label={`${run.marks.filter(Boolean).length} right so far`}>
              {run.qs.map((_, k) => (
                <span key={k} className={`size-3.5 rounded-full border ${run.marks[k] === true ? "border-emerald bg-emerald" : run.marks[k] === false ? "border-crimson bg-crimson" : k === run.i ? "border-gold ring-2 ring-gold/40" : "border-line"}`} />
              ))}
            </div>
          </div>
          <div className="mt-5"><PracticeQuestion key={q.id} q={q} picked={run.picked} onPick={pick} /></div>
          {run.picked && <button autoFocus onClick={next} className="btn-block btn-grass mt-5">{run.i + 1 < run.qs.length ? "Next" : "See my result"} <ArrowRight className="size-4" /></button>}
        </div>
        <button onClick={() => { if (confirm("Leave this Mastery Check? It won't be saved.")) setRun(null); }} className="mt-4 text-sm font-bold text-muted hover:text-fg">← Back to chapters</button>
      </div>
    );
  }

  const passed = list.filter((c) => s.mastery[c.id]?.passed).length;
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {result && (
        <div className={`block-panel mb-6 p-6 text-center ${result.score >= MASTERY_PASS ? "!border-emerald" : ""}`}>
          <div className="text-6xl" aria-hidden>{result.score >= MASTERY_PASS ? "🏆" : "📚"}</div>
          <div className={`mt-2 font-display text-3xl font-extrabold sm:text-4xl ${result.score >= MASTERY_PASS ? "text-emerald" : "text-amber"}`}>
            {result.score >= MASTERY_PASS ? `Chapter ${result.ch.label} Mastered!` : `${result.score} / ${TOTAL}. So close!`}
          </div>
          <p className="mt-2 text-lg text-muted">
            {result.score >= MASTERY_PASS ? `You got ${result.score} of ${TOTAL}. Now take the graded chapter quiz.` : `You need ${MASTERY_PASS} to pass. Review Chapter ${result.ch.label}, then try again.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {result.score >= MASTERY_PASS
              ? <Link href={`/chapters/${result.ch.id}/quiz/`} className="btn-block btn-grass">Take the Chapter {result.ch.label} quiz</Link>
              : <button onClick={() => start(result.ch)} className="btn-block btn-grass">Try again</button>}
            <Link href={`/review/?ch=${result.ch.id}`} className="btn-block">Review Deck</Link>
            <Link href={`/chapters/${result.ch.id}/`} className="btn-block">Back to the chapter</Link>
          </div>
        </div>
      )}
      <div className="block-panel p-5">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li><b className="text-fg">{TOTAL} questions</b> from the chapter&apos;s review bank. Get <b className="text-fg">{MASTERY_PASS} or more</b> right to pass.</li>
          <li>It&apos;s a warm-up for the graded chapter quiz: it&apos;s saved on this device only and never changes your XP or grades.</li>
          <li>Warm up first: read the chapter, then clear its missed questions in your <Link href="/review/" className="font-bold text-[var(--color-gold)] hover:underline">Review Deck</Link>.</li>
        </ul>
      </div>
      <h2 className="mt-8 font-display text-2xl font-extrabold">Choose a chapter <span className="text-base font-bold text-muted">({ready ? passed : 0} of {list.length} mastered)</span></h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((c) => {
          const m = ready ? s.mastery[c.id] : undefined;
          const r = realmForChapter(c.id);
          return (
            <button key={c.id} id={`m-${c.id}`} onClick={() => start(c)} style={{ "--accent": r.color } as CSSProperties}
              className={`accent-card min-h-28 rounded-2xl p-4 text-left ${m?.passed ? "!border-emerald" : ""} ${want === c.id ? "ring-2 ring-gold" : ""}`}>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">Chapter {c.label}</div>
              <div className="mt-1 font-bold leading-snug">{c.title}</div>
              <div className={`mt-2 text-xs font-extrabold ${m?.passed ? "text-emerald" : "text-muted"}`}>
                {m?.passed ? `✅ Mastered · best ${m.best}/${TOTAL}` : m?.tries ? `Best: ${m.best}/${TOTAL} · Try again` : "Not tried yet"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
