// Sub Guide: a one-page printable guide for a substitute teacher.
import type { Metadata } from "next";
import { SITE as S } from "@/data/config";
import { PRINT_CSS } from "@/components/x7b/print-css";
import { SubFields, PrintButton } from "./sub-fields";

export const metadata: Metadata = { title: "Sub Guide", description: "Substitute teacher guide: what students do on a sub day.", robots: { index: false } };

const SITE = S.domain;

const CSS = `
.sg { max-width: 860px; margin: 0 auto; }
.sg-sheet { border: 1px solid var(--color-line); border-radius: 18px; padding: 26px; background: var(--panel); }
.sg h2 { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; margin: 0 0 6px; }
.sg ol { list-style: decimal; padding-left: 1.3rem; } .sg ul { list-style: disc; padding-left: 1.3rem; }
.sg li { margin: 3px 0; font-size: .92rem; line-height: 1.45; }
.sg .box { border: 1.5px solid var(--color-line); border-radius: 12px; padding: 12px 14px; break-inside: avoid; }
.sg .grid2 { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.sg kbd, .sg .url { font-family: var(--font-mono); font-weight: 700; overflow-wrap: anywhere; }
.sg input, .sg textarea { width: 100%; background: transparent; border: 0; border-bottom: 1.5px dashed var(--color-line); color: inherit; font: inherit; padding: 2px 0; }
.sg textarea { border: 1.5px dashed var(--color-line); border-radius: 8px; padding: 6px 8px; resize: vertical; }
@media print {
  .sg-sheet { border: 0; padding: 0; }
  .sg { max-width: none; font-size: 11.5px; }
  .sg li { font-size: 11.5px; margin: 1px 0; } .sg h2 { font-size: 13.5px; } .sg .box { padding: 8px 10px; }
  .sg input, .sg textarea { border-color: #999; }
  @page { size: letter portrait; margin: .45in; }
}` + PRINT_CSS;

export default function SubGuide() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 sm:pt-32 print:!px-0 print:!pt-0">
      <style>{CSS}</style>
      <div className="no-print sg mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Fill in the boxes (optional), then print. Nothing you type is saved.</p>
        <PrintButton />
      </div>
      <article className="sg sg-sheet space-y-4" data-testid="sub-guide">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sky">{S.teacherPossessive} Economics · {SITE}</div>
            <h1 className="font-display text-3xl font-extrabold">🏔️ Sub Guide: {S.fullName}</h1>
          </div>
          <SubFields />
        </div>

        <div className="box">
          <h2>📝 Notes from {S.teacher}</h2>
          <textarea rows={3} aria-label={`Notes from ${S.teacher}`} placeholder="Today's plan, which periods, anything special…" />
        </div>

        <div className="grid2">
          <div className="box">
            <h2>📚 Reading day (most sub days)</h2>
            <ol>
              <li>Students go to <span className="url">{SITE}</span> and tap <b>Log in</b> (name, class period, 4-digit PIN).</li>
              <li>They open <b>My Climb</b> and do the next unchecked task: read the chapter, then take its quiz.</li>
              <li>Then the chapter&apos;s <b>Think Like an Economist</b> question, written in their notebook or the class assignment.</li>
              <li>Done early? Vocab Games, the Review Deck, or Mastery Checks.</li>
            </ol>
          </div>
          <div className="box">
            <h2>🗳 Discussion day</h2>
            <ol>
              <li>Put <span className="url">{SITE}/pick-a-side/</span> on the projector.</li>
              <li>Pick a debate from the chapter the class is on. Students vote on their own devices.</li>
              <li>Ask each side to give one reason from the chapter. Keep it respectful: many are real debates.</li>
            </ol>
          </div>
        </div>

        <div className="grid2">
          <div className="box">
            <h2>🛠 If something goes wrong</h2>
            <ul>
              <li>Page froze? Refresh it. Nothing is lost from student accounts.</li>
              <li>Student forgot their PIN? {S.teacher} can reset it. They can still read without logging in.</li>
              <li>No internet? Pages opened on this device before still work from the saved copy.</li>
            </ul>
          </div>
          <div className="box">
            <h2>✅ Good to know</h2>
            <ul>
              <li>Unit tests have limited tries. Students should only start one if {S.teacher} said so.</li>
              <li>Survey and Pick a Side results show totals only, never names.</li>
              <li>Students may use devices only for the class work on the screen.</li>
            </ul>
          </div>
        </div>
        <p className="pt-1 text-center font-display text-lg font-extrabold">Thank you for covering my class! — {S.teacher}</p>
      </article>
    </div>
  );
}
