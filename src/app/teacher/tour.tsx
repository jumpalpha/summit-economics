"use client";
// "Take a tour": a step-by-step walk through how Summit works, for the teacher.
// Steps can switch dashboard tabs and spotlight any element marked data-tour="…".
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SITE } from "@/data/config";

export type TourTab = "roster" | "keys" | "quests" | "ask" | "briefing" | "suggestions";
type Step = { title: string; body: string; tab?: TourTab; target?: string; link?: [string, string] };

const t = SITE.teacher;
export const TOUR: Step[] = [
  { title: `Welcome to ${SITE.fullName}`, body: `This tour shows how the site works for students and how you run it from here. It takes about 3 minutes. Use Next and Back, or press Esc to leave any time.` },
  { title: "The trail: 8 units, 24 chapters", body: "The course is a hike from the Trailhead to The Peak. Each unit has 3 chapters, and every chapter is tagged with the Idaho economics standards it covers (9-12.EC.1–24).", link: ["/realms/1/", "See Unit 1"] },
  { title: "What a student does in each chapter", body: "1) Read the chapter. 2) Pass the 20-question chapter quiz with 80% or better (unlimited retries, choices shuffle every time). 3) Answer the Think Like an Economist question. Each one is a checklist task.", link: ["/chapters/1/", "Open Chapter 1"] },
  { title: "Unit tests", body: "After a unit's 3 chapters, students take a 20-question unit test. 70% passes; they get 2 tries and the best score counts. Grading happens on the server, so the answers never reach the student's browser." },
  { title: "XP and trail ranks", body: "Every task is worth 25 XP, each day a student logs in is 5 XP, and each side quest you approve is 50 XP. Clearing a unit moves them up a rank: Greenhorn at the trailhead, Summiteer at the top.", link: ["/quest/", "See My Climb"] },
  { title: "How students log in", body: "Students sign in with their class period, their name, and a 4-digit PIN they choose. No email or Google account. If someone forgets a PIN, you reset it from the roster." },
  { title: "Extras students can do", body: `Pick a Side debates, the daily Survey, the Glossary, vocab practice, Side Quests (real-world projects), and Ask ${t}, an anonymous question box. None of these are required to clear a unit.`, link: ["/side-quests/", "See Side Quests"] },
  { title: "Your dashboard tabs", body: "Everything you manage lives in these tabs: the roster, answer keys, side quest approvals, the Ask inbox, the Daily Briefing, and student suggestions.", target: "tabs" },
  { title: "Class snapshot", body: "A quick read on the class you've picked: how many students, average XP, average unit test score, and how many need a nudge.", tab: "roster", target: "summary" },
  { title: "Pick a class period", body: "Filter to one period. Right now you're looking at the Sample Class, 20 fake students so you can see how a full class looks.", tab: "roster", target: "period" },
  { title: "The roster", body: "Each row shows a student's XP, rank, progress bar, best unit test score per unit, and last day active. Red scores are below 70%. Students marked \"Needs help\" have been inactive for a week or failed a test they haven't retaken. Tap Reset to give a student a new PIN.", tab: "roster", target: "table" },
  { title: "Answer keys", body: "Every chapter quiz, unit test, and Think Like an Economist model answer. The keys live only in the database and are never in the site's public code.", tab: "keys", target: "keys" },
  { title: "Side quest approvals", body: "When a student turns in a side quest, it shows up here. Read their note, then Approve to give 50 XP and the Trail Volunteer badge. Pending ones are listed first.", tab: "quests", target: "quests" },
  { title: `Ask ${t}`, body: "Anonymous student questions land here. Nothing tells you who asked. Write an answer and post it to the class board, mark it answered in class, or skip it. The Sample questions show how it works.", tab: "ask", target: "ask" },
  { title: "Daily Briefing", body: "Write a short announcement. Students see it when they open the site each day, along with the Survey of the Day results.", tab: "briefing" },
  { title: "Suggestions", body: "Students can suggest fixes or ideas from any page. Mark each one done or archive it.", tab: "suggestions" },
  { title: "Sample Class controls", body: "When real students join, tap Remove sample class. Tap Reset to bring the fake students back any time, for example to demo the site to another teacher.", tab: "roster", target: "demo" },
  { title: "You're set", body: "Tap Lock when you leave a shared computer. You can retake this tour any time with the Take a tour button. Happy climbing!", target: "lock" },
];

export function Tour({ open, onClose, setTab }: { open: boolean; onClose: () => void; setTab?: (t: TourTab) => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const step = TOUR[i];

  useEffect(() => { if (open) setI(0); }, [open]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => { if (open && step.tab && setTab) setTab(step.tab); }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps

  const measure = useCallback(() => {
    const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
    setBox(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    let tries = 0;
    const find = () => {
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      if (el) { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -110); setTimeout(measure, 120); } // top of screen: the tour card sits at the bottom
      else if (step.target && tries++ < 20) setTimeout(find, 150); // tab content may still be loading
      else setBox(null);
    };
    find();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure); };
  }, [open, i, step, measure]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, TOUR.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open) return null;
  const pad = 8;
  const last = i === TOUR.length - 1;
  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Site tour">
      {box ? (
        <div className="pointer-events-none fixed rounded-2xl ring-4 ring-gold transition-all duration-300"
          style={{ top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2, boxShadow: "0 0 0 9999px rgba(5,10,18,.62)" }} />
      ) : (
        <div className="fixed inset-0 bg-[rgba(5,10,18,.62)]" onClick={onClose} />
      )}
      <div className="fixed inset-x-3 bottom-3 mx-auto max-w-xl rounded-2xl border border-line bg-ink p-5 shadow-2xl sm:bottom-6">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-muted">
          <span>🥾 Tour · Step {i + 1} of {TOUR.length}</span>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-white/10" aria-label="Close tour">✕</button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold transition-all" style={{ width: `${((i + 1) / TOUR.length) * 100}%` }} /></div>
        <h3 className="mt-3 text-xl font-extrabold">{step.title}</h3>
        <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
        {step.link && <Link href={step.link[0]} target="_blank" className="mt-2 inline-block text-sm font-bold text-sky underline">{step.link[1]} ↗</Link>}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={() => setI((n) => Math.max(n - 1, 0))} disabled={i === 0} className="btn-block !text-sm disabled:opacity-40">Back</button>
          <button onClick={() => (last ? onClose() : setI(i + 1))} className="btn-block btn-grass !text-sm">{last ? "Finish" : "Next"}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
