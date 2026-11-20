"use client";

// Teacher view: the Ask the Teacher inbox.
// Every call is checked against the teacher passcode in the database.
import { useCallback, useEffect, useState } from "react";
import { askTeacherDelete, askTeacherList, askTeacherSet, type AskRow, type AskStatus } from "@/lib/ask";

const btn = "btn-block !px-3 !py-1.5 !text-xs";
const LABEL: Record<AskStatus, string> = { new: "🆕 New", posted: "📌 Posted to class", in_class: "🗣 Answered in class", skipped: "⏭ Skipped" };
const day = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export function AskTeacher({ hash }: { hash: string }) {
  const [Q, setQ] = useState<AskRow[] | null>(null);
  const [view, setView] = useState<AskStatus | "all">("new");
  const [err, setErr] = useState("");
  const [edits, setEdits] = useState<Record<string, { body: string; answer: string }>>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setQ(await askTeacherList(hash)); setErr(""); }
    catch (e) { setErr(`${(e as Error).message}. Has supabase/migrations/006_live.sql been run?`); }
  }, [hash]);
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- async load

  const val = (q: AskRow) => edits[q.id] ?? { body: q.body, answer: q.answer ?? "" };
  const act = async (q: AskRow, what: AskStatus | "delete") => {
    setErr("");
    try {
      if (what === "delete") {
        if (confirmDel !== q.id) { setConfirmDel(q.id); return; }
        setQ(await askTeacherDelete(hash, q.id)); setConfirmDel(null);
      } else {
        const v = val(q);
        if (what === "posted" && !v.answer.trim()) { setErr("Write an answer first. Students will see the question and your answer."); return; }
        setQ(await askTeacherSet(hash, q.id, v.answer.trim(), what, v.body));
      }
      setEdits((e) => { const n = { ...e }; delete n[q.id]; return n; });
    } catch (e) { setErr("Could not save: " + (e as Error).message); }
  };

  const n = (s: AskStatus) => (Q ?? []).filter((q) => q.status === s).length;
  const list = (Q ?? []).filter((q) => view === "all" || q.status === view);
  const tabs: [AskStatus | "all", string][] = [["new", "🆕 New"], ["posted", "📌 Posted"], ["in_class", "🗣 In class"], ["skipped", "⏭ Skipped"], ["all", "All"]];
  return (
    <div className="space-y-4" data-testid="ask-teacher">
      <div className="block-panel p-4 text-sm leading-relaxed text-muted">
        Students ask from <a href="/ask/" target="_blank" rel="noopener" className="font-bold text-gold underline">/ask/</a>. Questions are saved with <b className="text-fg">no name and no time</b>, so you can&apos;t reply to one person.
        <b className="text-fg"> Post</b> puts the question and your answer on the class board; <b className="text-fg">Answered in class</b> keeps it off the board. You can edit the question&apos;s wording before posting.
        If a question suggests a student may be unsafe, consider addressing it with the whole class and pointing everyone to the counselor and 988.
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(([k, t]) => <button key={k} onClick={() => setView(k)} className={`${btn} ${view === k ? "btn-grass" : ""}`}>{t}{k !== "all" ? ` (${n(k)})` : ""}</button>)}
        <button className={btn} onClick={load}>↻ Refresh</button>
      </div>
      {err && <p className="font-bold text-crimson">{err}</p>}
      {!Q ? <p className="font-bold text-muted">Loading questions…</p>
        : !list.length ? <p className="text-muted">{view === "new" ? "No new questions. 🎉" : "Nothing here yet."}</p>
        : list.map((q) => (
          <div key={q.id} className="block-panel space-y-2 p-4" data-question={q.id}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
              <span className="rounded bg-sky/15 px-1.5 py-0.5 uppercase tracking-wide text-sky">{q.topic}</span><span>{day(q.day)}</span><span className="ml-auto">{LABEL[q.status]}</span>
            </div>
            <textarea className="w-full rounded-xl border border-line bg-ink p-2.5 text-sm font-bold" rows={3} maxLength={1000} title="You can tidy the wording (typos, names) before posting"
              value={val(q).body} onChange={(e) => setEdits({ ...edits, [q.id]: { ...val(q), body: e.target.value } })} />
            <textarea className="w-full rounded-xl border border-line bg-ink p-2.5 text-sm" rows={4} maxLength={4000} placeholder="Your answer (needed to post it to the class board)"
              value={val(q).answer} onChange={(e) => setEdits({ ...edits, [q.id]: { ...val(q), answer: e.target.value } })} data-testid="ask-answer" />
            <div className="flex flex-wrap gap-1.5">
              <button className={`${btn} btn-grass`} onClick={() => act(q, "posted")} data-testid="ask-post">📌 Post answer to class</button>
              <button className={btn} onClick={() => act(q, "in_class")}>🗣 Answered in class</button>
              {q.status === "new" ? <button className={btn} onClick={() => act(q, "skipped")}>⏭ Skip</button> : <button className={btn} onClick={() => act(q, "new")}>↩ Back to New</button>}
              <button className={`${btn} !text-crimson`} onClick={() => act(q, "delete")}>{confirmDel === q.id ? "Tap again to delete" : "🗑 Delete"}</button>
            </div>
          </div>
        ))}
    </div>
  );
}
