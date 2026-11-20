"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { dbReady, grade, shuffle, type Graded } from "@/lib/db";
import { useProgress } from "@/lib/progress";
import { LoginDialog } from "@/components/login";
import { SITE } from "@/data/config";

export type Q = { id: string; q: string; choices: string[] };

export function Quiz({ kind, refN, questions, title, passPct, backHref }: {
  kind: "chapter" | "unit"; refN: number; questions: Q[]; title: string; passPct: number; backHref: string;
}) {
  const { student, state, refresh } = useProgress();
  const [order, setOrder] = useState<Q[] | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Graded | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [login, setLogin] = useState(false);

  // Shuffle after mount (so server and browser HTML match), and again on every retry.
  const deal = () => { setOrder(shuffle(questions).map((q) => ({ ...q, choices: shuffle(q.choices) }))); setPicks({}); setResult(null); setErr(null); };
  useEffect(deal, [questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const tries = kind === "unit" ? state?.unitTries?.[String(refN)] ?? 0 : 0;
  const maxTries = state?.unitAttempts ?? 2;
  const outOfTries = kind === "unit" && tries >= maxTries;
  const answered = Object.keys(picks).length;
  const best = state?.best?.[kind + refN];

  const submit = async () => {
    if (answered < questions.length && !confirm(`You left ${questions.length - answered} blank. Turn it in anyway?`)) return;
    if (kind === "unit" && !confirm(`Turn in your test? This uses try ${tries + 1} of ${maxTries}.`)) return;
    setBusy(true); setErr(null);
    try { setResult(await grade(kind, refN, picks)); await refresh(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  if (!order) return <div className="py-20 text-center font-pixel text-xs text-muted">Shuffling…</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="block-panel mb-6 p-5">
        <div className="pixel-title text-2xl">{title}</div>
        <div className="mt-1 text-sm font-bold text-muted">
          {questions.length} questions · pass with {passPct}%{kind === "unit" ? ` · ${maxTries} tries, best score counts` : " · unlimited practice"}
          {best != null && ` · your best: ${best}%`}
        </div>
        {!dbReady && <p className="mt-3 text-sm font-bold text-amber">Preview: grading turns on once the class database is connected.</p>}
        {dbReady && !student && <button onClick={() => setLogin(true)} className="btn-block btn-grass mt-3 !text-sm">Log in to get graded</button>}
        {kind === "unit" && student && <p className="mt-2 text-sm font-bold">Tries used: {tries} of {maxTries}</p>}
        {result && (
          <div className={`mt-4 rounded-xl border border-line p-4 ${result.passed ? "bg-emerald/25" : "bg-crimson/15"}`}>
            <div className="pixel-title text-3xl">{result.score} / {result.total} ({result.pct}%)</div>
            <p className="mt-1 font-bold">{result.passed ? "Passed! The task is checked off on My Climb. +25 XP" : `Not yet. You need ${passPct}%.`} Wrong answers are marked below. Go back to the chapter to find the right ones.</p>
            {kind === "chapter" && <button onClick={deal} className="btn-block mt-3 !text-sm"><RotateCcw className="size-4" /> Reshuffle and try again</button>}
          </div>
        )}
      </div>

      {outOfTries && !result ? (
        <p className="block-panel p-5 font-bold">You&apos;ve used all {maxTries} tries on this test. Your best score: {best ?? 0}%. Talk to {SITE.teacher} if you need another.</p>
      ) : (
        <ol className="space-y-4">
          {order.map((q, i) => {
            const r = result?.results[q.id];
            return (
              <li key={q.id} className={`block-panel p-5 ${result ? (r ? "!border-emerald" : "!border-crimson") : ""}`}>
                <div className="flex gap-3">
                  <span className="font-pixel text-xs leading-6 text-muted">{i + 1}.</span>
                  <p className="flex-1 font-extrabold leading-relaxed">{q.q}</p>
                  {result && (r ? <Check className="size-6 shrink-0 text-emerald" /> : <X className="size-6 shrink-0 text-crimson" />)}
                </div>
                <div className="mt-3 grid gap-2">
                  {q.choices.map((c, j) => {
                    const on = picks[q.id] === c;
                    return (
                      <button key={c} disabled={!!result} onClick={() => setPicks((p) => ({ ...p, [q.id]: c }))}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left font-semibold transition ${on ? "border-emerald bg-emerald/15" : "border-line hover:border-fg/40"}`}>
                        <span className={`grid size-6 shrink-0 place-items-center rounded-lg border border-line font-pixel text-[9px] ${on ? "bg-grass text-white" : ""}`}>{"ABCD"[j]}</span>
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!result && !outOfTries && (
        <div className="sticky bottom-3 mt-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-ink p-3">
          <span className="text-sm font-extrabold">{answered} / {questions.length} answered</span>
          {err && <span className="text-sm font-bold text-crimson">{err}</span>}
          <button onClick={submit} disabled={busy || !dbReady || !student} className="btn-block btn-grass disabled:opacity-50">{busy ? "Grading…" : "Turn it in"}</button>
        </div>
      )}
      {result && <div className="mt-6 text-center"><Link href={backHref} className="btn-block">Back</Link></div>}
      {login && <LoginDialog onClose={() => setLogin(false)} />}
    </div>
  );
}
