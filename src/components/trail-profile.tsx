"use client";

import Link from "next/link";
import { realms } from "@/data/site";
import { useProgress } from "@/lib/progress";

// The climb at a glance: one mountain, eight stops from the trailhead (bottom left) to the summit (top right).
// Cleared units turn green, the current one gets a "you are here" flag.
const W = 600, H = 440;
const STOPS: [number, number][] = [[52, 392], [118, 352], [178, 318], [232, 268], [288, 236], [340, 182], [392, 140], [452, 70]];

export function TrailProfile() {
  const { stats } = useProgress();
  const cleared = new Set(stats.cleared.map((r) => r.n));
  const current = realms.find((r) => !cleared.has(r.n))?.n ?? 0;
  const path = STOPS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full [mask-image:linear-gradient(black_82%,transparent)]" role="img" aria-label="Trail map: eight units from the trailhead to the summit">
        <defs>
          <linearGradient id="tp-mtn" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--range-far)" /><stop offset="1" stopColor="var(--range-near)" />
          </linearGradient>
          <linearGradient id="tp-trail" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#84cc16" /><stop offset="0.5" stopColor="#38bdf8" /><stop offset="1" stopColor="#f6c453" />
          </linearGradient>
        </defs>
        {/* back peak */}
        <path d="M140 440 L320 130 L380 200 L440 160 L600 320 L600 440 Z" fill="var(--range-far)" opacity="0.7" />
        {/* main mountain */}
        <path d="M0 440 L0 410 L140 330 L230 260 L300 210 L360 150 L420 96 L452 54 L490 94 L540 168 L600 260 L600 440 Z" fill="url(#tp-mtn)" stroke="var(--line)" />
        <path d="M452 54 L478 82 L466 80 L456 92 L446 82 L436 88 L430 80 Z" fill="#f1f6fb" />
        {/* pines */}
        {[[30, 418], [70, 402], [96, 410], [150, 372], [200, 340], [262, 300]].map(([x, y]) => (
          <path key={x} d={`M${x} ${y - 26} L${x + 9} ${y} L${x - 9} ${y} Z`} fill="var(--range-near)" stroke="var(--line)" />
        ))}
        {/* sun / moon */}
        <circle cx="88" cy="78" r="26" fill="#fde68a" opacity="0.85" />
        {/* trail */}
        <path d={path} fill="none" stroke="url(#tp-trail)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="trail-path" />
        {/* summit flag */}
        <g transform="translate(452 70)">
          <line x1="0" y1="0" x2="0" y2="-38" stroke="var(--fg)" strokeWidth="2.5" />
          <path d="M0 -38 L22 -31 L0 -24 Z" fill="#f25c45" />
        </g>
      </svg>
      {realms.map((r, i) => {
        const [x, y] = STOPS[i] ?? STOPS[STOPS.length - 1];
        const state = cleared.has(r.n) ? "cleared" : r.n === current ? "current" : "ahead";
        return (
          <Link key={r.n} href={`/realms/${r.n}/`} title={`Unit ${r.n}: ${r.name}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}>
            <span className={`grid size-10 place-items-center rounded-full border-2 text-lg shadow-lg transition-transform group-hover:scale-125 sm:size-11 ${
              state === "cleared" ? "border-emerald bg-emerald/25" : state === "current" ? "animate-bob border-gold bg-gold/25" : "border-line bg-ink/80"}`}
              style={state === "ahead" ? { borderColor: `color-mix(in srgb, ${r.color} 55%, transparent)` } : undefined}>
              {state === "cleared" ? "✓" : r.icon}
            </span>
            <span className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink/85 px-1.5 py-0.5 text-[10.5px] font-bold sm:text-[11px] ${state === "current" ? "text-gold" : "text-muted group-hover:text-fg"}`}>
              {r.n}. {r.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
