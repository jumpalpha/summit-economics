"use client";

import { useEffect, useMemo, useState } from "react";
import questions from "@/data/content/questions.json";
import sideQuests from "@/data/content/side_quests.json";
import { allTasks, chapterById, chapters, computeStats, realms, tlsKeyId } from "@/data/site";
import { dbReady, teacherApprove, teacherCheck, teacherDemo, teacherHash, teacherKeys, teacherResetPin, teacherRoster, type RosterRow } from "@/lib/db";
import { Tour } from "./tour";
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
  const [touring, setTouring] = useState(false);

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
        <div className="mt-4 text-center"><button onClick={() => setTouring(true)} className="btn-block !text-sm">🥾 Take a tour</button></div>
        <Tour open={touring} onClose={() => setTouring(false)} />
      </>
    );

  return (
    <>
      <PageHead eyebrow="Teacher" title="Teacher dashboard">
        <div className="mt-6 flex flex-wrap gap-2" data-tour="tabs">
          <button onClick={() => setTouring(true)} className="btn-block !text-sm !bg-gold/20">🥾 Take a tour</button>
          {(["roster", "keys", "quests"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`btn-block !text-sm ${tab === t ? "btn-grass" : ""}`}>{t === "roster" ? "Roster & scores" : t === "keys" ? "Answer keys" : "Side quests"}</button>
          ))}
          <button onClick={() => setTab("ask")} className={`btn-block !text-sm ${tab === "ask" ? "btn-grass" : ""}`}>Ask {SITE.teacher}</button>
          {X7B_TABS.map(([t, label]) => <button key={t} onClick={() => setTab(t)} className={`btn-block !text-sm ${tab === t ? "btn-grass" : ""}`}>{label}</button>)}
          <button onClick={() => { try { sessionStorage.removeItem(SKEY); } catch {} setHash(null); }} className="btn-block !text-sm" data-tour="lock">Lock</button>
        </div>
      </PageHead>
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <Tour open={touring} onClose={() => setTouring(false)} setTab={setTab} />
        {tab === "ask" ? <div data-tour="ask"><AskTeacher hash={hash} /></div> :
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
      <select data-tour="keys" value={sel} onChange={(e) => setSel(e.target.value)} className="mb-6 w-full max-w-lg rounded-xl border border-line bg-ink px-3 py-2 font-bold">
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

const pct = (n: number[]) => (n.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length) : null);
/** Whole calendar days between a YYYY-MM-DD day and today (never negative). */
const daysSince = (d?: string | null) => {
  if (!d) return null;
  const now = new Date();
  const [y, m, day] = d.split("-").map(Number);
  return Math.max(0, Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, day)) / 864e5));
};
/** Reasons a student may need a nudge: inactive a week, a failed unit test not yet retaken/passed, or nothing passed yet. */
function helpReasons(s: RosterRow) {
  const r: string[] = [];
  const idle = daysSince(s.lastDay);
  if (idle == null || idle >= 7) r.push(idle == null ? "never active" : `inactive ${idle} days`);
  for (const u of realms) { const b = s.best[`unit${u.n}`]; if (b != null && b < 70) r.push(`Unit ${u.n} test ${b}%`); }
  if (!s.tasks.some((t) => t.endsWith("_quiz"))) r.push("no quizzes passed");
  return r;
}

function Roster({ hash, questsOnly }: { hash: string; questsOnly: boolean }) {
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [period, setPeriod] = useState("all");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => teacherRoster(hash).then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps
  const periods = useMemo(() => [...new Set((rows ?? []).map((r) => r.period))], [rows]);
  const hasDemo = (rows ?? []).some((r) => r.demo);
  const realCount = (rows ?? []).filter((r) => !r.demo).length;
  // Start on the Sample Class while it's the only class, so the dashboard isn't empty.
  useEffect(() => { if (rows && period === "all" && hasDemo && realCount === 0) setPeriod("Sample Class"); }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  const title = (id: string) => (sideQuests.quests as { n: number; title: string }[]).find((q) => `sq${q.n}` === id)?.title ?? id;
  const demo = async (action: "reset" | "remove") => {
    if (action === "remove" && !confirm("Remove the Sample Class (20 fake students and 3 sample questions)? You can bring it back with Reset.")) return;
    setBusy(true);
    try { await teacherDemo(hash, action); if (action === "remove") setPeriod("all"); await load(); } catch (e) { alert((e as Error).message); }
    setBusy(false);
  };
  if (err) return <p className="font-bold text-crimson">{err}</p>;
  if (!rows) return <p className="font-bold text-muted">Loading roster…</p>;
  const list = rows.filter((r) => period === "all" || r.period === period);

  if (questsOnly) {
    const pending = list.flatMap((r) => r.sideQuests.map((q) => ({ r, q }))).sort((a, b) => Number(a.q.approved) - Number(b.q.approved));
    return (
      <div className="space-y-3" data-tour="quests">
        {pending.length === 0 && <p className="block-panel p-4 font-bold text-muted">No side quests turned in yet.</p>}
        {pending.map(({ r, q }) => (
          <div key={r.id + q.id} className="block-panel flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1"><b>{r.name}</b> ({r.period}) · {title(q.id)} · {q.term}<div className="text-sm text-muted">{q.note}</div></div>
            <button onClick={() => teacherApprove(hash, r.id, q.id, !q.approved).then(load)} className={`btn-block !text-sm ${q.approved ? "" : "btn-grass"}`}>{q.approved ? "Un-approve" : "Approve +50 XP"}</button>
          </div>
        ))}
      </div>
    );
  }

  const stats = list.map((s) => ({ s, st: computeStats({ tasks: s.tasks, days: Array(s.days).fill(""), sideQuests: s.sideQuests, cleared: s.cleared }), help: helpReasons(s) }));
  const unitScores = list.flatMap((s) => realms.map((u) => s.best[`unit${u.n}`]).filter((v): v is number => v != null));
  const quizScores = list.flatMap((s) => chapters.map((c) => s.best[`chapter${c.id}`]).filter((v): v is number => v != null));
  const needHelp = stats.filter((x) => x.help.length).length;
  const cards: [string, string | number, string][] = [
    ["Students", list.length, period === "all" ? "all periods" : period],
    ["Average XP", pct(stats.map((x) => x.st.xp)) ?? "–", "per student"],
    ["Avg chapter quiz", quizScores.length ? `${pct(quizScores)}%` : "–", "best score per quiz"],
    ["Avg unit test", unitScores.length ? `${pct(unitScores)}%` : "–", "best score per test"],
    ["Need a nudge", needHelp, "see flags below"],
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select data-tour="period" value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-line bg-ink px-3 py-2 font-bold">
          <option value="all">All periods ({rows.length})</option>
          {periods.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={load} className="btn-block !text-sm">Refresh</button>
        <div className="ml-auto flex flex-wrap items-center gap-2" data-tour="demo">
          {hasDemo && <span className="rounded-full bg-violet/20 px-3 py-1 text-xs font-extrabold text-violet">Sample Class is on</span>}
          <button disabled={busy} onClick={() => demo("reset")} className="btn-block !text-sm disabled:opacity-50">{hasDemo ? "Reset sample class" : "Add sample class"}</button>
          {hasDemo && <button disabled={busy} onClick={() => demo("remove")} className="btn-block !text-sm text-crimson disabled:opacity-50">Remove sample class</button>}
        </div>
      </div>
      {list.some((r) => r.demo) && (
        <p className="mb-4 rounded-xl border border-violet/40 bg-violet/10 p-3 text-sm font-bold">
          These are fake students for practice and demos. They can&apos;t log in, and they never count in survey or debate results.
        </p>
      )}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-tour="summary">
        {cards.map(([k, v, sub]) => (
          <div key={k} className="block-panel p-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-muted">{k}</div>
            <div className={`mt-1 text-2xl font-extrabold ${k === "Need a nudge" && Number(v) > 0 ? "text-amber" : ""}`}>{v}</div>
            <div className="text-xs text-muted">{sub}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line" data-tour="table">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-white/[0.04] text-left"><tr>
            <th className="p-2">Student</th><th className="p-2">Period</th><th className="p-2">XP</th><th className="p-2">Rank</th><th className="p-2">Progress</th>
            {realms.map((r) => <th key={r.n} className="p-2" title={r.testTitle}>U{r.n}</th>)}<th className="p-2">Last active</th><th className="p-2">PIN</th>
          </tr></thead>
          <tbody>
            {stats.map(({ s, st, help }) => {
              const prog = Math.round((100 * st.done.size) / allTasks.length);
              const idle = daysSince(s.lastDay);
              return (
                <tr key={s.id} className="border-t-2 border-line">
                  <td className="p-2 font-extrabold">{s.name}{help.length > 0 && <span title={help.join(", ")} className="ml-2 rounded-full bg-amber/20 px-2 py-0.5 text-[11px] font-extrabold text-amber">Needs help</span>}
                    {help.length > 0 && <div className="text-[11px] font-bold text-muted">{help.join(" · ")}</div>}</td>
                  <td className="p-2">{s.period}</td>
                  <td className="p-2">{st.xp}</td><td className="p-2">{st.rank.name}</td>
                  <td className="p-2"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald" style={{ width: `${prog}%` }} /></div><span className="text-xs text-muted">{prog}%</span></div></td>
                  {realms.map((r) => { const b = s.best[`unit${r.n}`]; return <td key={r.n} className={`p-2 ${b != null && b < 70 ? "font-extrabold text-crimson" : ""}`}>{b != null ? `${b}%` : "–"}</td>; })}
                  <td className="p-2 text-muted">{idle == null ? "never" : idle === 0 ? "today" : `${idle}d ago`}</td>
                  <td className="p-2">{s.demo ? <span className="text-muted">sample</span> : <button className="underline" onClick={async () => { const p = prompt(`New 4-digit PIN for ${s.name}?`); if (p && /^\d{4}$/.test(p)) { await teacherResetPin(hash, s.id, p); alert("PIN reset."); } }}>Reset</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
