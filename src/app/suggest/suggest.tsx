"use client";
// Suggest an Improvement: saved in econ_suggestions and read on the teacher dashboard (Suggestions tab).
// No email address is asked for or shown.
import Link from "next/link";
import { useEffect, useState } from "react";
import { dbReady, useStudent } from "@/lib/db";
import { needsUpdate, notInstalled, suggest, SUGGEST_CATS, type SuggestCat } from "@/lib/x7b";
import { SITE } from "@/data/config";

export function SuggestForm() {
  const { student } = useStudent();
  const [name, setName] = useState("");
  const [cat, setCat] = useState<SuggestCat>("bug");
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // ?from=/chapters/4/ pre-fills which page it's about (e.g. from a "Report a problem" link)
  useEffect(() => { const f = new URLSearchParams(location.search).get("from"); if (f) setPage(f.slice(0, 200)); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (msg.trim().length < 5) return setStatus({ ok: false, text: "Please write your suggestion before sending." });
    setBusy(true); setStatus(null);
    try {
      await suggest(student ? "" : name, cat, msg, page);
      setStatus({ ok: true, text: `Sent! ${SITE.teacher} reads every suggestion. Thank you for making ${SITE.name} better.` });
      setMsg("");
    } catch (x) {
      setStatus({ ok: false, text: notInstalled(x) ? `The suggestion box isn't switched on yet (${needsUpdate}) Please tell ${SITE.teacher} in class for now.` : (x as Error).message });
    } finally { setBusy(false); }
  };

  const field = "mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 font-semibold";
  return (
    <form onSubmit={send} className="block-panel space-y-4 p-6" data-testid="suggest-form">
      {student ? (
        <p className="rounded-xl border border-line px-3 py-2 text-sm">Sending as <b>{student.name}</b> ({student.period}). {SITE.teacher} will see your name.</p>
      ) : (
        <label className="block text-sm font-extrabold">Name (optional)
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Leave blank to send anonymously" />
        </label>
      )}
      <label className="block text-sm font-extrabold">What&apos;s this about?
        <select className={field} value={cat} onChange={(e) => setCat(e.target.value as SuggestCat)}>
          {SUGGEST_CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="block text-sm font-extrabold">Which page? (optional)
        <input className={field} value={page} onChange={(e) => setPage(e.target.value)} maxLength={200} placeholder="Example: Chapter 13 quiz, or Sprite Flap" />
      </label>
      <label className="block text-sm font-extrabold">Your suggestion
        <textarea className={field + " min-h-36"} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={2000} placeholder="Be as specific as you can: which page, what happened, what you'd change." />
        <span className="mt-1 block text-right text-xs font-semibold text-muted">{msg.length} / 2000</span>
      </label>
      {status && <p className={`rounded-xl p-3 text-sm font-bold ${status.ok ? "bg-emerald/15 text-emerald" : "bg-crimson/10 text-crimson"}`} role="status">{status.text}</p>}
      <button disabled={busy || !dbReady} className="btn-block btn-grass w-full justify-center disabled:opacity-50">{busy ? "Sending…" : "Send suggestion →"}</button>
      <p className="text-xs leading-relaxed text-muted">This is a feedback box only. It isn&apos;t part of XP, badges or your checklist. Questions about economics go in <Link href="/ask/" className="underline">Ask Mr. Dopp</Link>.</p>
    </form>
  );
}
