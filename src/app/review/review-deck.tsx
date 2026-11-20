"use client";
// ── wave-learnA: Review Deck (port of Dopps Class review.html) ──
// Every Quick Check missed in a chapter lands here. Get a card right 2 times in a row and it leaves the deck.
// When the deck is empty, practice any chapter's questions from the public review bank (review.json).
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { chapterById, sectionAnchors, type Chapter } from "@/data/site";
import type { ReviewQ } from "@/data/review";
import { chaptersWithReview, quickChecksFor, reviewForChapter, reviewQuestion } from "@/data/learn";
import { DECK_CLEAR, reviewDeckAnswer, useLearn } from "@/lib/learn-progress";
import { PracticeQuestion } from "@/components/practice-question";

type Card = ReviewQ & { ch: Chapter };

/** Where a question sits in its chapter: the section it follows as a Quick Check, if any. */
function whereIs(q: Card) {
  const at = quickChecksFor(q.ch).findIndex((l) => l.some((x) => x.id === q.id));
  if (at < 0) return { label: `Chapter ${q.ch.label}`, href: `/chapters/${q.ch.id}/` };
  return { label: `Chapter ${q.ch.label} · ${q.ch.sections[at].heading}`, href: `/chapters/${q.ch.id}/#${sectionAnchors(q.ch)[at]}` };
}

export function ReviewDeck() {
  const { s, ready } = useLearn();
  const [onlyCh, setOnlyCh] = useState<string | null>(null);
  const [mode, setMode] = useState<"deck" | "practice">("deck");
  const [practiceCh, setPracticeCh] = useState<string>(chaptersWithReview()[0]?.id ?? "1");
  const [cur, setCur] = useState<Card | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [cleared, setCleared] = useState(0);
  const [lastId, setLastId] = useState<string | null>(null);
  const [wasInDeck, setWasInDeck] = useState(false);
  const [drawN, setDrawN] = useState(0);

  useEffect(() => {
    const c = chapterById(new URLSearchParams(location.search).get("ch") ?? "");
    if (c) { setOnlyCh(c.id); setPracticeCh(c.id); }
  }, []);

  const all = useMemo(() => Object.keys(s.deck).map(reviewQuestion).filter((q): q is Card => !!q), [s.deck]);
  const mine = onlyCh ? all.filter((q) => q.ch.id === onlyCh) : all;

  const draw = (m = mode, pc = practiceCh, last = lastId) => {
    setPicked(null);
    setDrawN((n) => n + 1);
    if (m === "deck") {
      const pool = mine.length > 1 ? mine.filter((q) => q.id !== last) : mine;
      setCur(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null);
    } else {
      const c = chapterById(pc)!;
      const rows = reviewForChapter(c).filter((q) => q.id !== last);
      const q = rows[Math.floor(Math.random() * rows.length)];
      setCur(q ? { ...q, ch: c } : null);
    }
  };
  // First card once saved progress has loaded.
  useEffect(() => { if (ready && !cur && mode === "deck") draw(); }, [ready, onlyCh]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (o: string) => {
    if (!cur) return;
    setPicked(o);
    if (mode === "deck") {
      const was = cur.id in s.deck;
      setWasInDeck(was);
      const after = reviewDeckAnswer(cur.id, o === cur.a);
      if (was && !(cur.id in after.deck)) setCleared((n) => n + 1);
    }
  };
  const next = () => { setLastId(cur?.id ?? null); draw(mode, practiceCh, cur?.id ?? null); };
  const startPractice = () => { setMode("practice"); draw("practice", practiceCh, null); };
  const backToDeck = () => { setMode("deck"); setCur(null); setPicked(null); setTimeout(() => draw("deck", practiceCh, null)); };

  if (!ready) return <div className="py-16 text-center font-pixel text-xs text-muted">Loading your deck…</div>;
  const streak = cur && cur.id in s.deck ? s.deck[cur.id] : 0;
  const onlyLabel = onlyCh ? chapterById(onlyCh)?.label : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="flex flex-wrap gap-2 text-sm font-bold">
        <span className="rounded-full border border-line px-3 py-1">{all.length} in your deck</span>
        {onlyCh && <span className="rounded-full border border-line px-3 py-1">{mine.length} from Chapter {onlyLabel} · <button className="underline" onClick={() => { setOnlyCh(null); history.replaceState(null, "", "?"); setCur(null); }}>show all</button></span>}
        {cleared > 0 && <span className="rounded-full border border-emerald/50 px-3 py-1 text-emerald">✓ {cleared} cleared today</span>}
      </div>

      {cur ? (
        <div className="block-panel mt-4 p-5 sm:p-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
            {mode === "deck" ? "Review" : "Practice"} · <Link href={whereIs(cur).href} className="text-[var(--color-gold)] hover:underline">{whereIs(cur).label}</Link>
          </div>
          <PracticeQuestion key={drawN} q={cur} picked={picked} onPick={pick} />
          {picked && mode === "deck" && (
            <p className="mt-3 text-sm font-extrabold">
              {!(cur.id in s.deck) && wasInDeck ? "🎉 Cleared from your deck!" : picked === cur.a ? "One more right answer clears it." : "Streak reset. It will come back."}
            </p>
          )}
          {!picked && mode === "deck" && streak > 0 && <p className="mt-3 text-sm font-bold text-muted">Right {streak} time in a row. One more clears it.</p>}
          {picked && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={next} className="btn-block btn-grass">Next question <ArrowRight className="size-4" /></button>
              {mode === "practice" && <button onClick={backToDeck} className="btn-block">Back to my deck</button>}
            </div>
          )}
        </div>
      ) : (
        <div className="block-panel mt-4 p-6 text-center">
          <h2 className="font-display text-2xl font-extrabold">{all.length && onlyCh ? `Chapter ${onlyLabel} is clear! 🎉` : "Your deck is empty! 🎉"}</h2>
          <p className="mt-2 text-muted">{all.length && onlyCh ? "You still have questions from other chapters." : "Miss a Quick Check in a chapter and it shows up here for practice."}</p>
          {all.length > 0 && onlyCh && <button onClick={() => { setOnlyCh(null); history.replaceState(null, "", "?"); }} className="btn-block mt-3">Review the rest of my deck</button>}
          <div className="mt-6 font-extrabold">Or practice any chapter&apos;s questions:</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <label className="sr-only" htmlFor="rv-ch">Chapter to practice</label>
            <select id="rv-ch" value={practiceCh} onChange={(e) => setPracticeCh(e.target.value)} className="min-w-0 max-w-full rounded-xl border border-line bg-ink px-3 py-2.5 font-bold text-fg">
              {chaptersWithReview().map((c) => <option key={c.id} value={c.id}>Ch {c.label}: {c.title}</option>)}
            </select>
            <button onClick={startPractice} className="btn-block btn-grass">Practice this chapter ▶</button>
          </div>
        </div>
      )}
      <p className="mt-6 text-sm text-muted">
        Practice only: this never changes your grade or XP. Cards leave the deck after {DECK_CLEAR} right answers in a row. Your deck is saved on this device.
        {" "}Ready to prove it? Try a <Link href="/mastery/" className="font-bold text-[var(--color-gold)] hover:underline">Mastery Check</Link>.
      </p>
    </div>
  );
}
