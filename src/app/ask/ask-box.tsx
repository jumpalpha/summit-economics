"use client";

// Ask the teacher: questions are saved with no name and only the day.
import { useCallback, useEffect, useState } from "react";
import { dbReady, useStudent } from "@/lib/db";
import { askBoard, askSubmit, type AskPosted } from "@/lib/ask";
import { btnGold, input, label } from "@/components/forms/styles";
import { SITE } from "@/data/config";

const TOPICS = ["Economics question", "Markets, supply & demand", "Jobs, careers & business", "Money, banking & investing", "Budgets, credit & insurance", "Taxes, government & the Fed", "Trade & the global economy", "A chapter I'm reading", "Something else"];

export function AskBox() {
  const { student, ready } = useStudent();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [body, setBody] = useState("");
  const [hp, setHp] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [board, setBoard] = useState<AskPosted[] | null>(null);
  const [boardErr, setBoardErr] = useState("");
  const [find, setFind] = useState("");

  const load = useCallback(async () => {
    try { setBoard(await askBoard()); setBoardErr(""); }
    catch (e) { setBoardErr(/log in/i.test((e as Error).message) ? "Your login on this device doesn't work anymore. Log out and back in (top right)." : "Couldn't load the answers right now. Try again in a minute."); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load the class board once logged in
  useEffect(() => { if (student && dbReady) load(); }, [student, load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setOk(""); setErr("");
    if (hp) return;
    const b = body.trim();
    if (b.length < 3) return setErr("Please type your question first.");
    setSending(true);
    try {
      const r = await askSubmit(topic, b);
      setBody("");
      setOk(`✓ Sent! ${SITE.teacher} got your question with no name on it.${r.left_today === 0 ? " That was your last one for today." : r.left_today ? ` You can ask ${r.left_today} more today.` : ""} Watch for the answer in class or below.`);
    } catch (x) {
      const m = (x as Error).message;
      setErr(/3 questions|1000|type your|log in/i.test(m) ? m : "Couldn't send it right now. Please try again.");
    } finally { setSending(false); }
  };

  if (!ready) return null;
  if (!student) {
    return (
      <div className="block-panel p-6 text-center">
        <b className="font-display text-xl">Log in first</b>
        <p className="mt-2 text-muted">Only students in {SITE.teacherPossessive} class can ask. Log in with the button at the top right (your name, class period and PIN).</p>
        <p className="mt-2 text-sm text-muted">Logging in only proves you&apos;re in the class. Your question is still saved with no name attached.</p>
      </div>
    );
  }
  const term = find.toLowerCase();
  const list = (board ?? []).filter((x) => !term || (x.body + " " + x.answer + " " + x.topic).toLowerCase().includes(term));
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <form onSubmit={send} className="block-panel p-6" autoComplete="off">
        <h2 className="font-display text-2xl font-extrabold">✍ Your question</h2>
        <label className={`${label} mt-4`} htmlFor="topic">What&apos;s it about?</label>
        <select id="topic" className={input} value={topic} onChange={(e) => setTopic(e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        <label className={`${label} mt-4`} htmlFor="body">Ask anything (keep it respectful)</label>
        <textarea id="body" className={`${input} min-h-[140px] resize-y leading-relaxed`} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Example: Could the Yellowstone supervolcano erupt in my lifetime?" />
        <div className="text-right text-xs text-muted">{body.length}/1000</div>
        <input className="absolute -left-[9999px]" tabIndex={-1} aria-hidden value={hp} onChange={(e) => setHp(e.target.value)} />
        <button className={`${btnGold} mt-3 w-full`} disabled={sending || !dbReady} data-testid="ask-send">{sending ? "Sending…" : "🔒 Send anonymously"}</button>
        {ok && <p className="mt-3 rounded-xl border border-emerald/45 bg-emerald/10 p-3 text-sm font-bold text-emerald" data-testid="ask-ok">{ok}</p>}
        {err && <p className="mt-3 rounded-xl border border-crimson/40 bg-crimson/10 p-3 text-sm font-bold text-crimson" data-testid="ask-err">{err}</p>}
        <p className="mt-3 text-sm leading-relaxed text-muted">Don&apos;t put your name or anyone else&apos;s name in the question. You can ask up to 3 questions a day. {SITE.teacher} reads every question and picks which ones to answer for the class.</p>
      </form>
      <section className="block-panel p-6">
        <h2 className="font-display text-2xl font-extrabold">💬 Answered questions</h2>
        {(board?.length ?? 0) > 5 && <input className={`${input} mt-3`} placeholder="🔍 Search answers…" value={find} onChange={(e) => setFind(e.target.value)} />}
        <div className="mt-3" data-testid="ask-board">
          {boardErr ? <p className="text-sm text-muted">{boardErr}</p>
            : !board ? <p className="text-sm text-muted">Loading…</p>
            : !board.length ? <p className="text-sm text-muted">No answers posted yet. Be the first to ask!</p>
            : !list.length ? <p className="text-sm text-muted">No answers match that search.</p>
            : list.map((x, i) => (
              <div key={i} className="border-t border-line py-4 first:border-t-0 first:pt-1">
                <div className="whitespace-pre-wrap font-bold leading-relaxed"><span className="mr-2 font-display text-sky">Q</span>{x.body}</div>
                <div className="mt-2 whitespace-pre-wrap rounded-xl border-l-4 border-gold bg-gold/10 p-3 leading-relaxed">{x.answer}</div>
                <div className="mt-1.5 text-xs text-muted"><span className="mr-2 rounded bg-sky/15 px-1.5 py-0.5 font-bold uppercase tracking-wide text-sky">{x.topic}</span>
                  {x.answered_on ? "Answered " + new Date(x.answered_on + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
