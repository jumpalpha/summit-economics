"use client";

import { useEffect, useMemo, useState } from "react";
import questions from "@/data/content/questions.json";
import sideQuests from "@/data/content/side_quests.json";
import { chapterById, chapters, computeStats, realms, tlsKeyId } from "@/data/site";
import { dbReady, teacherApprove, teacherCheck, teacherHash, teacherKeys, teacherResetPin, teacherRoster, type RosterRow } from "@/lib/db";
import { SITE } from "@/data/config";
import { Md, PageHead } from "@/components/ui";
import { AskTeacher } from "./ask-teacher";
import { X7B_TABS, X7bTeacher, type X7bTab } from "./x7b-teacher";

type Q = { id: string; q: string; choices: string[] };
const SKEY = "summit_teacher";

export default function Teacher() {
  const [hash, setHash] = useState<string | null>(null);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"roster" | "keys" | "quests" | "ask" | X7bTab>("roster");

  useEffect(() => { try { const h = sessionStorage.getItem(SKEY); if (h) setHash(h); } catch {} }, []);

  const enter = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const h = await teacherHash(pass);
    try {
      if (await teacherCheck(h)) { setHash(h); try { sessionStorage.setItem(SKEY, h); } catch {} }
      else setErr("That isn't the teacher passcode.");
    } catch (x) { setErr((x as Error).message); }
  };

  if (!hash)
    return (
      <>
        <PageHead eyebrow="Teacher" title="Teacher dashboard" sub={`Answer keys, roster, scores, side quest approvals and the Ask ${SITE.teacher} inbox. Teacher only.`} />
        <form onSubmit={enter} className="block-panel mx-auto mt-10 max-w-sm p-6">
          {!dbReady && <p className="mb-3 text-sm font-bold text-amber">Preview: the class database isn&apos;t connected yet.</p>}
          <label className="block text-sm font-extrabold">Teacher passcode
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2" />
          </label>
          {err && <p className="mt-2 text-sm font-bold text-crimson">{err}</p>}
          <button disabled={!dbReady} className="btn-block btn-grass mt-4 w-full justify-center disabled:opacity-50">Enter</button>
        </form>
      </>
    );

  return (
    <>
      <PageHead eyebrow="Teacher" title="Teacher dashboard">
        <div className="mt-6 flex flex-wrap gap-2">
          {(["roster", "keys", "quests"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`btn-block !text-sm ${tab === t ? "btn-grass" : ""}`}>{t === "roster" ? "Roster & scores" : t === "keys" ? "Answer keys" : "Side quests"}</button>
          ))}
          <button onClick={() => setTab("ask")} className={`btn-block !text-sm ${tab === "ask" ? "btn-grass" : ""}`}>Ask {SITE.teacher}</button>
          {X7B_TABS.map(([t, label]) => <button key={t} onClick={() => setTab(t)} className={`btn-block !text-sm ${tab === t ? "btn-grass" : ""}`}>{label}</button>)}
          <button onClick={() => { try { sessionStorage.removeItem(SKEY); } catch {} setHash(null); }} className="btn-block !text-sm">Lock</button>
        </div>
      </PageHead>
      <div className="mx-auto max-w-7xl px-6 pt-10">
        {tab === "ask" ? <AskTeacher hash={hash} /> :
        X7B_TABS.some(([t]) => t === tab) ? <X7bTeacher hash={hash} tab={tab as X7bTab} /> :
        tab === "keys" ? <Keys hash={hash} /> : <Roster hash={hash} questsOnly={tab === "quests"} />}
      </div>
    </>
  );
}

function Keys({ hash }: { hash: string }) {
  const [keys, setKeys] = useState<Record<string, string> | null>(null);
  const [sel, setSel] = useState("c1");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { teacherKeys(hash).then(setKeys).catch((e) => setErr(e.message)); }, [hash]);
  const kind = sel[0] === "c" ? "chapter" : sel[0] === "u" ? "unit" : "tls";
  const n = sel.slice(1);
  const qs = kind === "tls" ? [] : (questions[kind] as Record<string, Q[]>)[n] ?? [];
  if (err) return <p className="font-bold text-crimson">{err}</p>;
  if (!keys) return <p className="font-bold text-muted">Loading keys…</p>;
  return (
    <div>
      <select value={sel} onChange={(e) => setSel(e.target.value)} className="mb-6 w-full max-w-lg rounded-xl border border-line bg-ink px-3 py-2 font-bold">
        <optgroup label="Chapter quizzes">{chapters.map((c) => <option key={c.id} value={`c${c.id}`}>Chapter {c.label} quiz</option>)}</optgroup>
        <optgroup label="Unit tests">{realms.map((r) => <option key={r.n} value={`u${r.n}`}>{r.testTitle}</option>)}</optgroup>
        <optgroup label="Think Like an Economist (model answers)">{chapters.map((c) => <option key={c.id} value={`t${c.id}`}>Chapter {c.label}: Think Like an Economist</option>)}</optgroup>
      </select>
      {kind === "tls" ? (
        <div className="block-panel p-5"><Md text={keys[chapterById(n) ? tlsKeyId(chapterById(n)!) : ""] ?? "No key loaded."} /></div>
      ) : (
        <ol className="space-y-3">
          {qs.map((q, i) => (
            <li key={q.id} className="block-panel p-4">
              <div className="font-extrabold">{i + 1}. {q.q}</div>
              <div className="mt-1 font-bold text-emerald">✓ {keys[q.id] ?? "(no key)"}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Roster({ hash, questsOnly }: { hash: string; questsOnly: boolean }) {
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [period, setPeriod] = useState("all");
  const [err, setErr] = useState<string | null>(null);
  const load = () => teacherRoster(hash).then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps
  const periods = useMemo(() => [...new Set((rows ?? []).map((r) => r.period))], [rows]);
  const title = (id: string) => (sideQuests.quests as { n: number; title: string }[]).find((q) => `sq${q.n}` === id)?.title ?? id;
  if (err) return <p className="font-bold text-crimson">{err}</p>;
  if (!rows) return <p className="font-bold text-muted">Loading roster…</p>;
  const list = rows.filter((r) => period === "all" || r.period === period);

  if (questsOnly) {
    const pending = list.flatMap((r) => r.sideQuests.map((q) => ({ r, q }))).sort((a, b) => Number(a.q.approved) - Number(b.q.approved));
    return (
      <div className="space-y-3">
        {pending.length === 0 && <p className="font-bold text-muted">No side quests turned in yet.</p>}
        {pending.map(({ r, q }) => (
          <div key={r.id + q.id} className="block-panel flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1"><b>{r.name}</b> ({r.period}) · {title(q.id)} · {q.term}<div className="text-sm text-muted">{q.note}</div></div>
            <button onClick={() => teacherApprove(hash, r.id, q.id, !q.approved).then(load)} className={`btn-block !text-sm ${q.approved ? "" : "btn-grass"}`}>{q.approved ? "Un-approve" : "Approve +50 XP"}</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-line bg-ink px-3 py-2 font-bold">
          <option value="all">All periods ({rows.length})</option>
          {periods.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={load} className="btn-block !text-sm">Refresh</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-white/[0.04] text-left"><tr>
            <th className="p-2">Student</th><th className="p-2">Period</th><th className="p-2">XP</th><th className="p-2">Rank</th>
            {realms.map((r) => <th key={r.n} className="p-2" title={r.testTitle}>U{r.n}</th>)}<th className="p-2">PIN</th>
          </tr></thead>
          <tbody>
            {list.map((s) => {
              const st = computeStats({ tasks: s.tasks, days: Array(s.days).fill(""), sideQuests: s.sideQuests, cleared: s.cleared });
              return (
                <tr key={s.id} className="border-t-2 border-line">
                  <td className="p-2 font-extrabold">{s.name}</td><td className="p-2">{s.period}</td>
                  <td className="p-2">{st.xp}</td><td className="p-2">{st.rank.name}</td>
                  {realms.map((r) => <td key={r.n} className="p-2">{s.best[`unit${r.n}`] != null ? `${s.best[`unit${r.n}`]}%` : "–"}</td>)}
                  <td className="p-2"><button className="underline" onClick={async () => { const p = prompt(`New 4-digit PIN for ${s.name}?`); if (p && /^\d{4}$/.test(p)) { await teacherResetPin(hash, s.id, p); alert("PIN reset."); } }}>Reset</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
