"use client";
// ── wave-learnA: local learning progress ──
// Quick Checks, the Review Deck, reading time, vocab game scores and Mastery practice are practice:
// they live in this browser only (localStorage key summit_learn) and never change XP or grades.
// The graded chapter quiz and Think Like an Economist tasks stay on the server (lib/progress.ts).
import { useEffect, useState } from "react";

export type LearnState = {
  /** Quick Check answers: question id -> [right on first try 0/1, time] */
  qa: Record<string, [number, number]>;
  /** Review Deck: missed question id -> right answers in a row since it was missed (2 clears it) */
  deck: Record<string, number>;
  /** Sections read: chapter id -> section index -> 1 */
  reads: Record<string, Record<string, 1>>;
  /** Seconds spent with the chapter's reading on screen */
  time: Record<string, number>;
  /** Best vocab game score: chapter id -> mode -> percent (a finished round) */
  vocab: Record<string, Record<string, number>>;
  /** Mastery practice: chapter id -> best of 10, tries, passed (8+) */
  mastery: Record<string, { best: number; tries: number; passed: boolean }>;
};
export const DECK_CLEAR = 2;
export const VOCAB_PASS = 70;
export const MASTERY_PASS = 8;
const KEY = "summit_learn";
const EVT = "summit-learn";
const empty = (): LearnState => ({ qa: {}, deck: {}, reads: {}, time: {}, vocab: {}, mastery: {} });

export function readLearn(): LearnState {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty(); }
}
/** Apply a change to the saved state and tell every open component. */
export function updateLearn(fn: (s: LearnState) => void) {
  const s = readLearn();
  fn(s);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  window.dispatchEvent(new Event(EVT));
  return s;
}

/** The saved state (empty until mounted, so server and browser HTML match). */
export function useLearn() {
  const [s, setS] = useState<LearnState>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => { setS(readLearn()); setReady(true); };
    load();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) load(); };
    window.addEventListener(EVT, load);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(EVT, load); window.removeEventListener("storage", onStorage); };
  }, []);
  return { s, ready };
}

// ── actions ──
/** First answer to a Quick Check. A miss goes into the Review Deck. Later answers don't change it. */
export const answerQuickCheck = (id: string, ok: boolean) => updateLearn((s) => {
  if (s.qa[id]) return;
  s.qa[id] = [ok ? 1 : 0, Date.now()];
  if (!ok) s.deck[id] = 0;
});
/** A Review Deck answer: 2 right in a row clears the card, a miss resets the streak. */
export const reviewDeckAnswer = (id: string, ok: boolean) => updateLearn((s) => {
  if (!(id in s.deck)) return;
  s.deck[id] = ok ? s.deck[id] + 1 : 0;
  if (s.deck[id] >= DECK_CLEAR) delete s.deck[id];
});
export const markSectionRead = (ch: string, i: number) => updateLearn((s) => { (s.reads[ch] ??= {})[i] = 1; });
export const addReadingTime = (ch: string, sec: number) => updateLearn((s) => { s.time[ch] = (s.time[ch] ?? 0) + sec; });
export const saveVocab = (ch: string, mode: string, pct: number) => updateLearn((s) => {
  const v = (s.vocab[ch] ??= {});
  v[mode] = Math.max(v[mode] ?? 0, pct);
});
export const saveMastery = (ch: string, score: number) => updateLearn((s) => {
  const m = (s.mastery[ch] ??= { best: 0, tries: 0, passed: false });
  m.best = Math.max(m.best, score); m.tries++; m.passed ||= score >= MASTERY_PASS;
});

export const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : m ? `${m} min` : `${Math.round(sec)} s`;
};
