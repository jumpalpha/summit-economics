"use client";
// ── wave-learnA: Vocab Engine (port of Dopps Class vocab_engine.html) ──
// 4 modes for every chapter's key words: Flashcard Flip, Speed Quiz, Word Builder, Concept Map.
// Same rules as Dopps Class: flip before you score a flashcard, 30 s per Speed Quiz question, 8 words per
// Word Builder round, 10 words per Concept Map round (at least one per big idea, both answers must be right).
// A finished round saves its best score on this device (summit_learn) for the chapter's Chapter Path.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Delete, Eye, ListChecks, RotateCcw, SkipForward, Volume2, X } from "lucide-react";
import { chapters, realmForChapter, type Chapter } from "@/data/site";
import { chapterFromQuery, vocabFor, vocabModes, type Term, type VocabMode } from "@/data/learn";
import { conceptMap, type BigIdea } from "@/data/concept-map";
import { VOCAB_PASS, saveVocab, useLearn } from "@/lib/learn-progress";

const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const WB_WORDS = 8, CM_TERMS = 10, SQ_SECONDS = 30, CM_WAIT_MEANING = 1200, CM_WAIT_IDEA = 700;
const CM_COLORS = ["#38bdf8", "#34d399", "#f25c45", "#a78bfa", "#f6c453"];

type Score = { right: number; wrong: number; streak: number };

function cmIndex(ideas: BigIdea[] | undefined) {
  const gi: Record<string, number> = {};
  ideas?.forEach((g, i) => g.terms.forEach((t) => { gi[t] = i; }));
  return gi;
}
/** A Concept Map round: up to 10 mapped words, at least one from every big idea. */
function cmPick(all: Term[], ideas: BigIdea[], gi: Record<string, number>) {
  const mapped = shuffle(all.filter((t) => t.t in gi));
  const pick: Term[] = [];
  ideas.forEach((_, i) => { const t = mapped.find((x) => gi[x.t] === i); if (t) pick.push(t); });
  for (const t of mapped) if (pick.length < CM_TERMS && !pick.includes(t)) pick.push(t);
  return shuffle(pick.slice(0, CM_TERMS));
}

export function VocabEngine() {
  const [ch, setCh] = useState<Chapter | null>(null);
  const [mode, setMode] = useState<VocabMode>("flashcard");
  // Read ?ch= and #mode after mount (static export: no server-side search params).
  useEffect(() => {
    const read = () => {
      setCh(chapterFromQuery(new URLSearchParams(location.search).get("ch")));
      const h = location.hash.replace("#", "");
      setMode((vocabModes.find((m) => m.id === h)?.id ?? "flashcard") as VocabMode);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const pickMode = (m: VocabMode) => { history.replaceState(null, "", `?ch=${ch?.id ?? 1}${m === "flashcard" ? "" : "#" + m}`); setMode(m); };
  const pickChapter = (id: string) => { history.replaceState(null, "", `?ch=${id}${mode === "flashcard" ? "" : "#" + mode}`); setCh(chapterFromQuery(id)); };

  if (!ch) return <div className="py-24 text-center font-pixel text-xs text-muted">Loading words…</div>;
  const realm = realmForChapter(ch.id);
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6" style={{ "--accent": realm.color } as CSSProperties}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="vocab-ch">Chapter</label>
        <select id="vocab-ch" value={ch.id} onChange={(e) => pickChapter(e.target.value)}
          className="min-w-0 max-w-full flex-1 rounded-xl border border-line bg-ink px-3 py-2.5 font-bold text-fg sm:flex-none">
          {chapters.map((c) => <option key={c.id} value={c.id}>Ch {c.label}: {c.title}</option>)}
        </select>
        <Link href={`/chapters/${ch.id}/`} className="btn-block !px-3 !py-2.5 !text-sm"><ArrowLeft className="size-4" /> Back to chapter</Link>
      </div>
      <div role="tablist" aria-label="Vocab game" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {vocabModes.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => pickMode(m.id)}
            style={{ "--accent": m.color } as CSSProperties}
            className={`rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${mode === m.id ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-fg" : "border-line text-muted hover:text-fg"}`}>
            <span aria-hidden>{m.icon}</span> {m.title}
          </button>
        ))}
      </div>
      <Game key={`${ch.id}-${mode}`} ch={ch} mode={mode} />
    </div>
  );
}

function Game({ ch, mode }: { ch: Chapter; mode: VocabMode }) {
  const all = useMemo(() => vocabFor(ch), [ch]);
  const ideas = conceptMap[ch.id];
  const gi = useMemo(() => cmIndex(ideas), [ideas]);
  const deal = useCallback(() => {
    if (mode === "wordbuild") return shuffle(all).slice(0, WB_WORDS);
    if (mode === "conceptmap") return ideas ? cmPick(all, ideas, gi) : [];
    return shuffle(all);
  }, [all, mode, ideas, gi]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<Score>({ right: 0, wrong: 0, streak: 0 });
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<{ t: string; g: number; ok: boolean }[]>([]);
  const [cmStarted, setCmStarted] = useState(false);
  useEffect(() => { setTerms(deal()); setIdx(0); setScore({ right: 0, wrong: 0, streak: 0 }); setPlaced([]); setCmStarted(false); }, [deal, round]);
  const restart = () => setRound((r) => r + 1);

  const mark = (ok: boolean) => setScore((s) => ok ? { right: s.right + 1, wrong: s.wrong, streak: s.streak + 1 } : { right: s.right, wrong: s.wrong + 1, streak: 0 });
  const next = () => setIdx((i) => i + 1);

  const done = terms.length > 0 && idx >= terms.length;
  const pct = score.right + score.wrong ? Math.round((score.right / (score.right + score.wrong)) * 100) : 0;
  const saved = useRef(false);
  useEffect(() => { saved.current = false; }, [round, ch.id, mode]);
  useEffect(() => { if (done && !saved.current) { saved.current = true; saveVocab(ch.id, mode, pct); } }, [done, ch.id, mode, pct]);

  if (mode === "conceptmap" && !ideas) return <Panel><p className="py-10 text-center font-bold text-muted">The concept map for this chapter is coming soon. Try the other three games.</p></Panel>;
  if (!all.length) return <Panel><p className="py-10 text-center font-bold text-muted">No key words for this chapter yet.</p></Panel>;
  if (!terms.length) return null;

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-xl font-extrabold sm:text-2xl">Ch {ch.label}: {ch.title}</h2>
        <Pill cls="text-emerald">✓ {score.right}</Pill>
        <Pill cls="text-crimson">✗ {score.wrong}</Pill>
        {score.streak >= 3 && <Pill cls="text-amber">🔥 {score.streak} streak</Pill>}
        <Pill cls="text-muted">{Math.min(idx, terms.length)}/{terms.length}</Pill>
      </div>
      <div className="xp-bar mt-3"><div className="xp-fill" style={{ width: `${(Math.min(idx, terms.length) / terms.length) * 100}%` }} /></div>

      {done ? (
        <Results ch={ch} mode={mode} pct={pct} score={score} onAgain={restart}>
          {mode === "conceptmap" && ideas && <CmMap ideas={ideas} placed={placed} title={ch.title} final />}
        </Results>
      ) : mode === "flashcard" ? (
        <Flashcard key={idx} term={terms[idx]} onScore={(ok) => { mark(ok); next(); }} onRestart={restart} />
      ) : mode === "speedquiz" ? (
        <SpeedQuiz key={idx} term={terms[idx]} pool={all} onDone={(ok) => { mark(ok); next(); }} onRestart={restart} />
      ) : mode === "wordbuild" ? (
        <WordBuild key={idx} term={terms[idx]} pool={all} onDone={(ok) => { mark(ok); next(); }} onRestart={restart} />
      ) : !cmStarted ? (
        <CmIntro ideas={ideas!} count={terms.length} onStart={() => setCmStarted(true)} />
      ) : (
        <>
          <CmCard key={idx} term={terms[idx]} n={idx} total={terms.length} pool={all} ideas={ideas!} gi={gi}
            onAnswered={(ok) => { mark(ok); setPlaced((p) => [...p, { t: terms[idx].t, g: gi[terms[idx].t], ok }]); }}
            onNext={() => { next(); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <CmMap ideas={ideas!} placed={placed} title={ch.title} />
        </>
      )}
      <HowTo mode={mode} />
    </>
  );
}

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`block-panel mt-5 p-5 sm:p-7 ${className}`}>{children}</div>;
const Pill = ({ children, cls }: { children: React.ReactNode; cls: string }) => <span className={`rounded-full border border-line bg-ink-2/60 px-3 py-1 text-sm font-extrabold ${cls}`}>{children}</span>;
const choiceCls = (state: "idle" | "right" | "wrong" | "dim") =>
  `w-full rounded-xl border-2 px-4 py-3 text-left font-semibold leading-snug transition ${
    state === "right" ? "border-emerald bg-emerald/15" : state === "wrong" ? "border-crimson bg-crimson/15" : state === "dim" ? "border-line opacity-60" : "border-line hover:border-[var(--accent)]"}`;

// ── Flashcard Flip ──
function Flashcard({ term, onScore, onRestart }: { term: Term; onScore: (ok: boolean) => void; onRestart: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(false);
  const [hint, setHint] = useState(false);
  const flip = () => { setFlipped((f) => !f); setSeen(true); setHint(false); };
  const scoreIt = (ok: boolean) => { if (!seen) { setFlipped(true); setSeen(true); setHint(true); return; } onScore(ok); };
  return (
    <div className="mt-5">
      <button onClick={flip} aria-label={flipped ? "Show the word" : "Show the definition"} className="block w-full [perspective:1200px]">
        <div className={`relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d] sm:h-72 ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
          <div className="block-panel absolute inset-0 grid place-items-center p-6 [backface-visibility:hidden]">
            <div>
              <div className="font-pixel text-[10px] text-muted">Word</div>
              <div className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-5xl">{term.t}</div>
              <div className="mt-4 text-sm font-semibold text-muted">Tap to flip</div>
            </div>
          </div>
          <div className="block-panel absolute inset-0 grid place-items-center border-[var(--accent)] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div>
              <div className="font-pixel text-[10px] text-muted">Definition</div>
              <div className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{term.d}</div>
            </div>
          </div>
        </div>
      </button>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={flip} className="btn-block"><RotateCcw className="size-4" /> Flip</button>
        <button onClick={() => scoreIt(true)} className="btn-block !border-emerald/60 !text-emerald">✓ Got it</button>
        <button onClick={() => scoreIt(false)} className="btn-block !border-crimson/60 !text-crimson">✗ Still learning</button>
        <button onClick={onRestart} className="btn-block !text-muted">↺ Restart</button>
      </div>
      {hint && <p className="mt-3 text-center font-extrabold text-crimson">Flip the card first: read the definition, then choose.</p>}
    </div>
  );
}

// ── Speed Quiz ──
function SpeedQuiz({ term, pool, onDone, onRestart }: { term: Term; pool: Term[]; onDone: (ok: boolean) => void; onRestart: () => void }) {
  const opts = useMemo(() => shuffle([term, ...shuffle(pool.filter((x) => x.t !== term.t)).slice(0, 3)]), [term, pool]);
  const [left, setLeft] = useState(SQ_SECONDS);
  const [pick, setPick] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const over = pick !== null || timedOut;
  useEffect(() => {
    if (over) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 0.1)), 100);
    return () => clearInterval(t);
  }, [over]);
  useEffect(() => { if (left <= 0 && !over) setTimedOut(true); }, [left, over]);
  useEffect(() => {
    if (!over) return;
    const t = setTimeout(() => onDone(pick === term.t), 1800);
    return () => clearTimeout(t);
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mt-5">
      <Panel className="!mt-0">
        <div className="font-pixel text-[10px] text-muted">Which word matches this definition?</div>
        <p className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{term.d}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Time left" aria-valuenow={Math.ceil(left)} aria-valuemin={0} aria-valuemax={SQ_SECONDS}>
          <div className={`h-full rounded-full transition-[width] duration-100 ${left < 10 ? "bg-crimson" : "bg-gradient-to-r from-sky to-emerald"}`} style={{ width: `${(left / SQ_SECONDS) * 100}%` }} />
        </div>
      </Panel>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {opts.map((o, i) => (
          <button key={o.t} disabled={over} onClick={() => setPick(o.t)}
            className={choiceCls(!over ? "idle" : o.t === term.t ? "right" : o.t === pick ? "wrong" : "dim")}>
            <b className="mr-2 text-muted">{"ABCD"[i]}.</b>{o.t}
          </button>
        ))}
      </div>
      {over && <p className={`mt-3 text-center font-bold ${pick === term.t ? "text-emerald" : "text-crimson"}`}>
        {pick === term.t ? "✓ Correct! " : timedOut ? "⏱ Time's up. " : "✗ Not quite. "}<span className="text-fg">{term.t}</span>: <span className="text-muted">{term.d}</span></p>}
      <div className="mt-4 flex justify-center"><button onClick={onRestart} className="btn-block !text-muted">↺ Restart</button></div>
    </div>
  );
}

// ── Word Builder ──
const isLetter = (c: string) => /[A-Z0-9]/.test(c);
type Slot = { ch: string; kind: "gap" | "fixed" | "given" | "fill"; val: string };
function WordBuild({ term, pool, onDone, onRestart }: { term: Term; pool: Term[]; onDone: (ok: boolean) => void; onRestart: () => void }) {
  const init = useMemo(() => {
    const chars = term.t.toUpperCase().split("");
    const first = chars.findIndex(isLetter);
    const slots: Slot[] = chars.map((c, i) => ({ ch: c, kind: c === " " ? "gap" : !isLetter(c) ? "fixed" : i === first ? "given" : "fill", val: i === first || !isLetter(c) ? c : "" }));
    const tiles = shuffle(slots.filter((s) => s.kind === "fill").map((s) => s.ch)).map((l) => ({ l, used: false }));
    return { slots, tiles };
  }, [term]);
  const [slots, setSlots] = useState(init.slots);
  const [tiles, setTiles] = useState(init.tiles);
  const [stack, setStack] = useState<{ tile: number; slot: number }[]>([]);
  const [choices, setChoices] = useState<string[] | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string; picked?: string } | null>(null);

  const finish = useCallback((ok: boolean, msg: string, picked?: string, wait = ok ? 1400 : 2400) => {
    setResult({ ok, msg, picked });
    setTimeout(() => { try { speechSynthesis.cancel(); } catch {} onDone(ok); }, wait);
  }, [onDone]);

  const tap = (i: number) => {
    if (result || choices || tiles[i]?.used) return;
    const s = slots.findIndex((x) => x.kind === "fill" && !x.val);
    if (s < 0) return;
    const ns = slots.map((x, k) => (k === s ? { ...x, val: tiles[i].l } : x));
    setSlots(ns); setTiles(tiles.map((t, k) => (k === i ? { ...t, used: true } : t))); setStack([...stack, { tile: i, slot: s }]);
    if (!ns.some((x) => x.kind === "fill" && !x.val)) {
      const built = ns.map((x) => (x.kind === "gap" ? " " : x.val)).join("");
      const ok = built === term.t.toUpperCase();
      finish(ok, ok ? `✓ Correct! "${term.t}"` : `✗ Not quite. The answer was "${term.t}"`);
    }
  };
  const undo = () => {
    if (result || !stack.length) return;
    const m = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    setTiles(tiles.map((t, k) => (k === m.tile ? { ...t, used: false } : t)));
    setSlots(slots.map((x, k) => (k === m.slot ? { ...x, val: "" } : x)));
  };
  const clear = () => { if (result) return; setStack([]); setTiles(init.tiles); setSlots(init.slots); };
  const showChoices = () => { if (!result) setChoices(shuffle([term.t, ...shuffle(pool.filter((x) => x.t !== term.t).map((x) => x.t)).slice(0, 2)])); };
  const reveal = () => { if (result) return; setChoices(null); setSlots(slots.map((x) => (x.kind === "fill" ? { ...x, val: x.ch } : x))); finish(false, `Answer: ${term.t}`, undefined, 2200); };
  const skip = () => { if (!result) onDone(false); };
  const speak = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(term.d); u.rate = 0.9; speechSynthesis.speak(u); } catch {} };

  // keyboard: a letter uses a matching tile, Backspace undoes
  const tapRef = useRef(tap), undoRef = useRef(undo);
  useEffect(() => { tapRef.current = tap; undoRef.current = undo; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (choices || (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA|SELECT/)) return;
      if (e.key === "Backspace") { e.preventDefault(); undoRef.current(); return; }
      const k = e.key.toUpperCase();
      if (k.length === 1 && isLetter(k)) { const i = tiles.findIndex((t) => !t.used && t.l === k); if (i >= 0) tapRef.current(i); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tiles, choices]);

  const nextSlot = slots.findIndex((x) => x.kind === "fill" && !x.val);
  const words: { s: Slot; i: number }[][] = [[]];
  slots.forEach((s, i) => (s.kind === "gap" ? words.push([]) : words[words.length - 1].push({ s, i })));
  return (
    <div className="mt-5">
      <Panel className="!mt-0">
        <div className="font-pixel text-[10px] text-muted">What word matches this definition?</div>
        <p className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{term.d}</p>
        <button onClick={speak} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-muted hover:text-fg"><Volume2 className="size-4" /> Read to me</button>
      </Panel>
      {choices ? (
        <div className="mt-4">
          <p className="text-center text-sm font-semibold text-muted">Tap the matching word:</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {choices.map((c) => (
              <button key={c} disabled={!!result} onClick={() => finish(c === term.t, c === term.t ? `✓ Correct! "${term.t}"` : `✗ The answer was "${term.t}"`, c)}
                className={choiceCls(!result ? "idle" : c === term.t ? "right" : c === result.picked ? "wrong" : "dim") + " text-center"}>{c}</button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={`mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3 rounded-2xl p-2 ${result ? (result.ok ? "bg-emerald/10" : "bg-crimson/10") : ""}`}>
            {words.map((w, k) => (
              <div key={k} className="flex flex-wrap justify-center gap-1">
                {w.map(({ s, i }) => (
                  <span key={i} className={`grid h-10 w-8 place-items-center rounded-lg border-2 font-display text-lg font-extrabold sm:h-12 sm:w-10 sm:text-xl ${
                    s.kind === "fixed" ? "border-transparent" : s.kind === "given" ? "border-line bg-line/40 text-muted" : i === nextSlot && !result ? "border-[var(--accent)]" : "border-line"}`}>{s.val}</span>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm font-semibold text-muted">Tap the letters in order (or type them):</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {tiles.map((t, i) => (
              <button key={i} onClick={() => tap(i)} disabled={t.used || !!result} aria-label={`Letter ${t.l}`}
                className={`grid size-11 place-items-center rounded-xl border-2 font-display text-lg font-extrabold transition ${t.used ? "border-transparent opacity-20" : "border-line bg-ink-2/60 hover:-translate-y-0.5 hover:border-[var(--accent)]"}`}>{t.l}</button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <button onClick={undo} className="btn-block !px-3 !py-2 !text-sm"><Delete className="size-4" /> Undo</button>
            <button onClick={clear} className="btn-block !px-3 !py-2 !text-sm"><X className="size-4" /> Clear</button>
            <button onClick={showChoices} className="btn-block !px-3 !py-2 !text-sm"><ListChecks className="size-4" /> Show 3 choices</button>
            <button onClick={reveal} className="btn-block !px-3 !py-2 !text-sm"><Eye className="size-4" /> Reveal answer</button>
          </div>
        </>
      )}
      {result && <p className={`mt-4 text-center text-lg font-extrabold ${result.ok ? "text-emerald" : "text-crimson"}`}>{result.msg}</p>}
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={skip} className="btn-block"><SkipForward className="size-4" /> Skip</button>
        <button onClick={onRestart} className="btn-block !text-muted">↺ Restart</button>
      </div>
    </div>
  );
}

// ── Concept Map ──
function CmIntro({ ideas, count, onStart }: { ideas: BigIdea[]; count: number; onStart: () => void }) {
  return (
    <Panel>
      <div className="font-pixel text-[10px] text-[var(--accent)]">🗺️ Concept Map</div>
      <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">See how this chapter&apos;s ideas connect</h2>
      <p className="mt-3 leading-relaxed text-muted"><b className="text-fg">Why do this?</b> Knowing a definition is step one. Knowing which <b className="text-fg">big idea</b> a word belongs to is how you really understand a chapter. Tests and real fieldwork ask &ldquo;how does this connect?&rdquo;, not just &ldquo;what does this word mean?&rdquo;</p>
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 font-semibold">
        <li>Read the word and pick what it means (one of three).</li>
        <li>Pick the big idea it belongs to. Each one says exactly what belongs in it.</li>
        <li>Read the feedback. Every answer tells you why, and your map grows as you go.</li>
      </ol>
      <p className="mt-3 text-sm font-bold text-muted">A word only counts when <span className="text-fg">both</span> answers are right, so guessing won&apos;t get you through. Reading will.</p>
      <div className="mt-5 font-pixel text-[10px] text-muted">This chapter&apos;s {ideas.length} big ideas</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {ideas.map((g, i) => (
          <div key={g.name} className="rounded-xl border-l-4 bg-ink-2/50 p-3" style={{ borderColor: CM_COLORS[i % CM_COLORS.length] }}>
            <b>{g.name}</b><span className="mt-0.5 block text-sm text-muted">{g.idea}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center"><button onClick={onStart} className="btn-block btn-grass">Start mapping → ({count} words)</button></div>
    </Panel>
  );
}

function CmCard({ term, n, total, pool, ideas, gi, onAnswered, onNext }: {
  term: Term; n: number; total: number; pool: Term[]; ideas: BigIdea[]; gi: Record<string, number>; onAnswered: (ok: boolean) => void; onNext: () => void;
}) {
  // the right meaning + one from the same big idea (a close cousin) + one from another big idea
  const choices = useMemo(() => {
    const g = gi[term.t];
    const others = pool.filter((x) => x.t in gi && x.t !== term.t && x.d !== term.d);
    const same = shuffle(others.filter((x) => gi[x.t] === g)), other = shuffle(others.filter((x) => gi[x.t] !== g));
    return shuffle([term, ...[same[0] ?? other[1], other[0]].filter(Boolean)]).map((x) => x.d);
  }, [term, pool, gi]);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [idea, setIdea] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(0); // 1 = meaning choices open, 2 = big ideas open
  useEffect(() => { const t = setTimeout(() => setUnlocked(1), CM_WAIT_MEANING); return () => clearTimeout(t); }, []);
  useEffect(() => { if (meaning === null) return; const t = setTimeout(() => setUnlocked(2), CM_WAIT_IDEA); return () => clearTimeout(t); }, [meaning]);
  const g = gi[term.t], right = ideas[g];
  const meaningOk = meaning === term.d, ideaOk = idea === g;
  const nextBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (idea !== null) nextBtn.current?.focus({ preventScroll: true }); }, [idea]);

  const pickMeaning = (d: string) => { if (meaning === null && unlocked >= 1) setMeaning(d); };
  const pickIdea = (i: number) => { if (idea === null && unlocked >= 2) { setIdea(i); onAnswered(meaning === term.d && i === g); } };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = parseInt(e.key, 10);
      if (meaning === null && k >= 1 && k <= choices.length) pickMeaning(choices[k - 1]);
      else if (meaning !== null && idea === null && k >= 1 && k <= ideas.length) pickIdea(k - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Panel>
      <div className="text-sm font-bold text-muted">Word {n + 1} of {total}</div>
      <div className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{term.t}</div>
      <Step n={1}>What does it mean?</Step>
      <div className="grid gap-2">
        {choices.map((d) => (
          <button key={d} disabled={meaning !== null || unlocked < 1} onClick={() => pickMeaning(d)}
            className={choiceCls(meaning === null ? (unlocked < 1 ? "dim" : "idle") : d === term.d ? "right" : d === meaning ? "wrong" : "dim")}>{d}</button>
        ))}
      </div>
      {meaning !== null && (
        <>
          <Fb ok={meaningOk}>{meaningOk ? <>✓ Right. <b>{term.t}</b>: {term.d}</> : <>✗ Not that one. <b>{term.t}</b> means: {term.d}</>}</Fb>
          <Step n={2}>Which big idea does it belong to?</Step>
          <div className="grid gap-2 sm:grid-cols-2">
            {ideas.map((gr, i) => (
              <button key={gr.name} disabled={idea !== null || unlocked < 2} onClick={() => pickIdea(i)} style={{ borderLeftColor: CM_COLORS[i % CM_COLORS.length] }}
                className={choiceCls(idea === null ? (unlocked < 2 ? "dim" : "idle") : i === g ? "right" : i === idea ? "wrong" : "dim") + " !border-l-[6px]"}>
                <b className="block">{gr.name}</b><span className="mt-0.5 block text-sm font-normal text-muted">{gr.idea}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {idea !== null && (
        <>
          <Fb ok={ideaOk}>
            {ideaOk ? <>✓ Yes. <b>{term.t}</b> belongs in <b>{right.name}</b>: {right.idea}</>
              : <>✗ It belongs in <b>{right.name}</b>: {right.idea}<span className="mt-1 block text-sm opacity-80">&ldquo;{ideas[idea].name}&rdquo; is for: {ideas[idea].idea}</span></>}
          </Fb>
          <div className={`mt-3 rounded-xl border p-3 text-sm font-extrabold ${meaningOk && ideaOk ? "border-emerald/50 text-emerald" : "border-crimson/50 text-crimson"}`}>
            {meaningOk && ideaOk ? "✓ Counts as correct: both answers right." : "✗ Doesn't count yet: both answers have to be right. It's on your map so you can review it."}
          </div>
          <div className="mt-4 flex justify-center"><button ref={nextBtn} onClick={onNext} className="btn-block btn-grass">{n + 1 < total ? "Next word →" : "See my map →"}</button></div>
        </>
      )}
    </Panel>
  );
}
const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="mb-2 mt-5 flex items-center gap-2 font-extrabold"><span className="grid size-6 place-items-center rounded-full bg-[var(--accent)] text-xs text-[#10140e]">{n}</span>{children}</div>
);
const Fb = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <div className="mt-3 rounded-xl p-3 text-sm font-semibold leading-relaxed text-fg" style={{ background: `color-mix(in srgb, var(--color-${ok ? "emerald" : "crimson"}) 12%, transparent)` }}>{children}</div>
);

function CmMap({ ideas, placed, title, final }: { ideas: BigIdea[]; placed: { t: string; g: number; ok: boolean }[]; title: string; final?: boolean }) {
  if (!placed.length) return final ? null : <div className="mt-4 rounded-2xl border border-dashed border-line p-5 text-center text-sm font-semibold text-muted">Your map will grow here as you place words.</div>;
  return (
    <div className="block-panel mt-4 p-5">
      <div className="font-extrabold">{final ? "Your finished map" : "Your map so far"} · <span className="text-muted">{title}</span></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ideas.map((g, i) => {
          const items = placed.filter((p) => p.g === i);
          return (
            <div key={g.name} className="rounded-xl border-l-4 bg-ink-2/50 p-3" style={{ borderColor: CM_COLORS[i % CM_COLORS.length] }}>
              <div className="font-bold">{g.name}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.length ? items.map((p) => (
                  <span key={p.t} title={p.ok ? "Both answers right" : "Review this one"}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${p.ok ? "border-emerald/50 text-emerald" : "border-crimson/50 text-crimson"}`}>{p.ok ? "✓" : "✗"} {p.t}</span>
                )) : <span className="text-xs text-muted">—</span>}
              </div>
            </div>
          );
        })}
      </div>
      {final && <p className="mt-3 text-sm text-muted">✗ words are filed under the big idea they really belong to. Review them, then play again.</p>}
    </div>
  );
}

// ── Results + how it counts ──
function Results({ ch, mode, pct, score, onAgain, children }: { ch: Chapter; mode: VocabMode; pct: number; score: Score; onAgain: () => void; children?: React.ReactNode }) {
  const { s } = useLearn();
  const best = s.vocab[ch.id]?.[mode] ?? pct;
  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : "D";
  const icon = { A: "🏆", B: "⭐", C: "💪", D: "📚" }[grade];
  const msg = { A: "Summit reached! You know these words.", B: "Great work! Almost there.", C: "Good effort. Review the ones you missed.", D: "Keep climbing. You've got this!" }[grade];
  return (
    <>
      <Panel className="text-center">
        <div className="text-6xl" aria-hidden>{icon}</div>
        <div className={`mt-2 font-display text-6xl font-extrabold ${pct >= VOCAB_PASS ? "text-emerald" : "text-amber"}`}>{pct}%</div>
        <p className="mt-1 text-lg font-bold">{msg}</p>
        <p className={`mt-2 text-sm font-extrabold ${pct >= VOCAB_PASS ? "text-emerald" : "text-muted"}`}>
          {pct >= VOCAB_PASS ? "✓ Counts on your Chapter Path (this device)." : `Get ${VOCAB_PASS}% or more to check this game off your Chapter Path.`} Best: {best}%
        </p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
          <div className="rounded-xl border border-line p-3"><div className="text-2xl font-extrabold text-emerald">{score.right}</div><div className="text-xs font-bold text-muted">Correct</div></div>
          <div className="rounded-xl border border-line p-3"><div className="text-2xl font-extrabold text-crimson">{score.wrong}</div><div className="text-xs font-bold text-muted">Missed</div></div>
          <div className="rounded-xl border border-line p-3"><div className="text-2xl font-extrabold">{pct}%</div><div className="text-xs font-bold text-muted">Score</div></div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button onClick={onAgain} className="btn-block btn-grass"><RotateCcw className="size-4" /> Play again</button>
          <Link href={`/chapters/${ch.id}/#path`} className="btn-block"><ArrowLeft className="size-4" /> Back to chapter</Link>
        </div>
      </Panel>
      {children}
    </>
  );
}

const HOWTO: Record<VocabMode, string[]> = {
  flashcard: ["Read the word, then tap the card to flip it and read the definition.", "Then tap ✓ Got it or ✗ Still learning. (You have to flip before you can choose.)", "Be honest: only tap Got it if you really knew it.", "Go through the whole deck to the results screen."],
  speedquiz: ["Pick the word that matches the definition before the timer runs out. Timeouts count as misses.", "Answer every question to reach the results screen."],
  wordbuild: ["Build each word with the letter tiles (or type, or use Show 3 choices).", "Skip and Reveal answer count as misses.", "Finish all 8 words to reach the results screen."],
  conceptmap: ["For each word, pick what it means, then the big idea it belongs to.", "A word counts only when both answers are right. Every answer tells you why.", "Finish all the words to see your finished map."],
};
function HowTo({ mode }: { mode: VocabMode }) {
  return (
    <div className="mt-6 rounded-2xl border border-line p-5 text-sm">
      <div className="font-extrabold">✓ How to check it off your Chapter Path</div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">{HOWTO[mode].map((x) => <li key={x}>{x}</li>)}<li>Score {VOCAB_PASS}% or more.</li></ol>
      <p className="mt-2 text-xs text-muted">Vocab games are practice: they save on this device and never change your XP or grades.</p>
    </div>
  );
}
