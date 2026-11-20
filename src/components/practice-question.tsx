"use client";
// ── wave-learnA: one multiple-choice practice question from review.json (Quick Checks, Review Deck, Mastery) ──
import { useEffect, useState } from "react";
import { asChoices, type ReviewQ } from "@/data/review";

export function PracticeQuestion({ q, n, picked, onPick, extra }: {
  q: ReviewQ; n?: number; picked: string | null; onPick: (choice: string) => void; extra?: React.ReactNode;
}) {
  // Shuffle after mount so server and browser HTML match.
  const [opts, setOpts] = useState<string[]>([q.a, ...q.wrong]);
  useEffect(() => setOpts(asChoices(q)), [q]);
  const ok = picked === q.a;
  return (
    <div>
      <p className="font-extrabold leading-snug">{n != null && <span className="mr-1 text-muted">{n}.</span>}{q.q}</p>
      <div className="mt-2.5 grid gap-2">
        {opts.map((o, i) => {
          const st = picked == null ? "" : o === q.a ? "border-emerald bg-emerald/15" : o === picked ? "border-crimson bg-crimson/15" : "opacity-60";
          return (
            <button key={o} type="button" disabled={picked != null} onClick={() => onPick(o)}
              className={`flex min-h-11 items-start gap-3 rounded-xl border-2 border-line px-3 py-2.5 text-left font-semibold leading-snug transition ${picked == null ? "hover:border-[var(--accent,var(--color-gold))]" : ""} ${st}`}>
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-line font-mono text-[11px] font-bold text-muted">{"ABCD"[i]}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {picked != null && (
        <p className={`mt-2.5 text-sm font-semibold leading-relaxed ${ok ? "text-emerald" : "text-crimson"}`}>
          {ok ? "✓ Right! " : `✗ The answer is “${q.a}.” `}<span className="text-fg">{q.why}</span>{extra}
        </p>
      )}
    </div>
  );
}
