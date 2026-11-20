// Printable Climb Sheet: every task on paper.
// Every realm's tasks from src/data/site.ts (realmTasks), with the unit test as the realm's "boss" and bonus tasks marked.
// The preview is a sheet of paper (dark ink on white) in both themes, and prints the same way.
import type { Metadata } from "next";
import Link from "next/link";
import { allTasks, realmChapterLabel, realms, realmTasks, requiredTasks, ranks, XP_PER_TASK } from "@/data/site";
import { PRINT_CSS } from "@/components/x7b/print-css";
import { PrintButton } from "../sub-guide/sub-fields";
import { SITE } from "@/data/config";

export const metadata: Metadata = { title: "Print Climb Sheet", description: "A printable checklist of every task in all eight units." };

const required = realms.reduce((n, r) => n + requiredTasks(r).length, 0);
const bonus = allTasks.length - required;

const CSS = `
.pq-doc { background:#fff; color:#151a12; border-radius:14px; box-shadow:0 20px 60px -20px rgba(0,0,0,.55); overflow:hidden; font-size:12.5px; }
.pq-head { background:#1d2419; color:#fff; padding:18px 22px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; }
.pq-logo { font-family:var(--font-display); font-weight:800; font-size:22px; color:#f6c453; }
.pq-title { text-align:center; flex:1; min-width:200px; } .pq-title b { display:block; font-family:var(--font-display); font-size:18px; letter-spacing:.12em; }
.pq-title span { font-size:11px; color:#cfd8c6; }
.pq-who { display:grid; gap:4px; font-size:12px; min-width:170px; } .pq-who div { display:flex; gap:6px; } .pq-who i { flex:1; border-bottom:1px solid #cfd8c6; min-width:90px; }
.pq-body { padding:14px 18px 18px; columns:2 300px; column-gap:18px; }
.pq-realm { break-inside:avoid; border:1.5px solid #d6dccf; border-radius:10px; margin:0 0 12px; overflow:hidden; display:inline-block; width:100%; }
.pq-rh { display:flex; align-items:center; gap:8px; padding:6px 10px; color:#fff; }
.pq-rh .n { font-family:var(--font-display); font-weight:800; font-size:14px; flex:1; line-height:1.15; } .pq-rh small { display:block; font-size:10px; font-weight:600; opacity:.9; }
.pq-rh .b { font-size:10px; font-weight:800; background:rgba(0,0,0,.25); padding:2px 7px; border-radius:99px; white-space:nowrap; }
.pq-rt { list-style:none; margin:0; padding:5px 10px 7px; }
.pq-rt li { display:flex; gap:7px; align-items:flex-start; padding:2.5px 0; line-height:1.3; border-bottom:1px dotted #e2e6dc; }
.pq-rt li:last-child { border-bottom:0; }
.pq-box { flex:0 0 auto; width:12px; height:12px; border:1.5px solid #1d2419; border-radius:3px; margin-top:1px; }
.pq-boss { font-weight:800; } .pq-boss .pq-box { border-width:2.5px; border-radius:50%; }
.pq-tag { font-size:9px; font-weight:800; letter-spacing:.06em; padding:0 5px; border-radius:4px; margin-left:4px; white-space:nowrap; }
.pq-tag.bonus { background:#e9f6ef; color:#047857; border:1px solid #9bd8b8; } .pq-tag.boss { background:#fff3d6; color:#8a5a00; border:1px solid #f0c66a; }
.pq-foot { break-inside:avoid; border:1.5px solid #d6dccf; border-radius:10px; padding:10px 12px; display:inline-block; width:100%; }
.pq-badges { display:grid; grid-template-columns:repeat(9,1fr); gap:4px; text-align:center; margin:6px 0; }
.pq-badges span { border:1.5px dashed #9aa58f; border-radius:8px; padding:4px 0; font-size:16px; } .pq-badges small { display:block; font-size:8px; font-weight:700; color:#5c6754; }
.pq-legend { display:flex; flex-wrap:wrap; gap:10px; font-size:10.5px; margin-top:6px; } .pq-legend span { display:inline-flex; gap:5px; align-items:center; }
.pq-ranks { font-size:10px; color:#5c6754; margin-top:6px; line-height:1.4; }
@media print {
  .pq-doc { box-shadow:none; border-radius:0; font-size:10.5px; }
  .pq-head { padding:10px 14px; } .pq-body { padding:8px 0 0; column-gap:12px; }
  .pq-realm { margin-bottom:8px; } .pq-rt li { padding:1.5px 0; }
  @page { size:letter portrait; margin:.4in; }
}` + PRINT_CSS;

export default function PrintQuest() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 sm:px-6 sm:pt-32 print:!px-0 print:!pt-0">
      <style>{CSS}</style>
      <div className="no-print mb-6 text-center">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Printable quest sheet</div>
        <h1 className="font-display text-4xl font-extrabold">🖨 {SITE.name} on paper</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted">Every task in all {realms.length} units on one checklist, to track alongside My Climb. Prints best double-sided.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2"><PrintButton label="Print / Save as PDF" /><Link href="/quest/" className="btn-block !text-sm">← My Climb</Link></div>
        <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Print preview</div>
      </div>
      <article className="pq-doc" data-testid="print-quest">
        <div className="pq-head">
          <div><div className="pq-logo">▲ {SITE.name}</div><div style={{ fontSize: 10, color: "#cfd8c6" }}>{SITE.teacherPossessive} Economics</div></div>
          <div className="pq-title"><b>CLIMB PROGRESS SHEET</b><span>{allTasks.length} tasks · {realms.length} units · Greenhorn to Summiteer</span></div>
          <div className="pq-who"><div>Name: <i /></div><div>Period: <i /></div><div>Started: <i /></div></div>
        </div>
        <div className="pq-body">
          {realms.map((r) => (
            <section key={r.n} className="pq-realm">
              <div className="pq-rh" style={{ background: `color-mix(in srgb, ${r.color} 70%, #1d2419)` }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span className="n">Realm {r.n}: {r.name}<small>Chapters {realmChapterLabel(r)} · {r.biome}</small></span>
                <span className="b">{r.badge}</span>
              </div>
              <ul className="pq-rt">
                {realmTasks(r).map((t) => {
                  const boss = t.key === `unit${r.n}`;
                  return (
                    <li key={t.key} className={boss ? "pq-boss" : ""}>
                      <span className="pq-box" />
                      <span>{boss ? `⚔ ${t.label}` : t.label.replace(/ \(bonus\)$/, "")}
                        {boss && <span className="pq-tag boss">BOSS</span>}{t.bonus && <span className="pq-tag bonus">BONUS</span>}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <section className="pq-foot">
            <b style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>Badge progress</b> <span style={{ fontSize: 10, color: "#5c6754" }}>Color each badge when you clear its realm</span>
            <div className="pq-badges">{realms.map((r) => <span key={r.n}>{r.icon}<small>{r.badge.replace(/ Badge$/, "")}</small></span>)}</div>
            <div className="pq-legend">
              <span><span className="pq-box" /> Task</span>
              <span><span className="pq-box" style={{ borderWidth: 2.5, borderRadius: "50%" }} /> Unit test: the summit push</span>
              <span><span className="pq-tag bonus" style={{ marginLeft: 0 }}>BONUS</span> XP, but not needed to clear the unit</span>
            </div>
            <div className="pq-ranks"><b>{required}</b> required + <b>{bonus}</b> bonus tasks · {XP_PER_TASK} XP each ({(allTasks.length * XP_PER_TASK).toLocaleString()} XP total) · Ranks: {ranks.map((x) => x.name).join(" → ")}</div>
            <div className="pq-ranks">Digital version with saving: <b>{SITE.domain}/quest/</b></div>
          </section>
        </div>
      </article>
    </div>
  );
}
