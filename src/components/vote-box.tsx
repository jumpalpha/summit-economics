"use client";

import { useEffect, useState } from "react";
import { dbReady, results, vote } from "@/lib/db";
import { useStudent } from "@/lib/db";

/** Two-or-more option vote with live class results. `reasonLabel` adds a required "why" box. */
export function VoteBox({ kind, item, options, reasonLabel, openEnded }: {
  kind: "survey" | "debate"; item: string; options: string[]; reasonLabel?: string; openEnded?: boolean;
}) {
  const { student } = useStudent();
  const [pick, setPick] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    try { const saved = localStorage.getItem(`summit_vote_${kind}_${item}`); if (saved) { setPick(saved); if (dbReady) results(kind, item).then((c) => alive && setCounts(c)).catch(() => {}); } } catch {}
    return () => { alive = false; };
  }, [kind, item]);

  const send = async () => {
    if (!pick) return;
    if (reasonLabel && reason.trim().length < 10) return setErr("Back it up: write at least a sentence of evidence.");
    try {
      setCounts(await vote(kind, item, openEnded ? "answered" : pick, openEnded ? pick : reason || undefined));
      try { localStorage.setItem(`summit_vote_${kind}_${item}`, pick); } catch {}
      setErr(null);
    } catch (e) { setErr((e as Error).message); }
  };

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  if (counts && !openEnded)
    return (
      <div className="space-y-2">
        {options.map((o) => {
          const n = counts[o] ?? 0, pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <div key={o}>
              <div className="flex justify-between text-sm font-extrabold"><span>{o}{pick === o && " ← you"}</span><span>{pct}% ({n})</span></div>
              <div className="xp-bar !h-3"><div className="xp-fill" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
        <button onClick={() => setCounts(null)} className="text-sm font-bold text-muted underline">Change my answer</button>
      </div>
    );
  if (counts && openEnded) return <p className="font-bold text-emerald">Thanks! {total} classmates have answered.</p>;

  return (
    <div>
      {openEnded ? (
        <textarea value={pick ?? ""} onChange={(e) => setPick(e.target.value)} rows={3} placeholder="Your answer…" className="w-full rounded-xl border border-line bg-ink p-3 font-semibold" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o) => (
            <button key={o} onClick={() => setPick(o)} className={`rounded-xl border px-4 py-3 text-left font-extrabold ${pick === o ? "border-emerald bg-emerald/15" : "border-line hover:border-fg/40"}`}>{o}</button>
          ))}
        </div>
      )}
      {reasonLabel && pick && (
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={reasonLabel} className="mt-3 w-full rounded-xl border border-line bg-ink p-3 font-semibold" />
      )}
      {err && <p className="mt-2 text-sm font-bold text-crimson">{err}</p>}
      <div className="mt-3">
        {!dbReady ? <span className="text-sm font-bold text-muted">Preview: voting turns on once the class database is connected.</span>
          : !student ? <span className="text-sm font-bold text-muted">Log in (top right) to vote and see the class results.</span>
          : <button onClick={send} disabled={!pick} className="btn-block btn-grass !text-sm disabled:opacity-50">Lock it in</button>}
      </div>
    </div>
  );
}
