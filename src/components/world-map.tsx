"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Check, Lock, MapPin } from "lucide-react";
import { realmChapterLabel, realms, realmTasks } from "@/data/site";
import { useProgress } from "@/lib/progress";
import { ArtIcon } from "@/components/art-icon";

/** The unit cards: cleared units glow green, the current one is highlighted, the rest are dashed until reached. */
export function WorldMap() {
  const { stats } = useProgress();
  const cleared = new Set(stats.cleared.map((r) => r.n));
  const current = realms.find((r) => !cleared.has(r.n))?.n ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {realms.map((r, i) => {
        const tasks = realmTasks(r);
        const done = tasks.filter((t) => stats.done.has(t.key)).length;
        const pct = Math.round((done / tasks.length) * 100);
        const state = cleared.has(r.n) ? "cleared" : r.n === current ? "current" : "locked";
        return (
          <Link key={r.n} href={`/realms/${r.n}/`}
            style={{ "--accent": state === "cleared" ? "#34d399" : r.color, animationDelay: `${i * 60}ms` } as CSSProperties}
            className={`accent-card group flex animate-rise flex-col overflow-hidden rounded-3xl p-6 ${
              state === "cleared" ? "!border-emerald/60 shadow-[0_0_40px_-12px_rgba(52,211,153,0.7)]"
              : state === "current" ? "!border-gold/70 shadow-[0_0_44px_-14px_rgba(246,196,83,0.8)]"
              : "!border-dashed opacity-80 hover:opacity-100"}`}>
            <div className="flex items-start justify-between gap-4">
              <span className={`-m-2 grid size-24 shrink-0 place-items-center transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110 ${state === "locked" ? "grayscale-[0.6]" : ""}`}>
                <ArtIcon fallback={r.icon} size={80} />
              </span>
              {state === "cleared" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-1 text-[11px] font-bold text-emerald"><Check className="size-3" /> Cleared</span>
              ) : state === "current" ? (
                <span className="inline-flex animate-bob items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold"><MapPin className="size-3" /> You are here</span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"><Lock className="size-3" /> Unit {r.n}</span>
              )}
            </div>
            <div className="mt-5 flex-1">
              <h3 className="font-display text-2xl font-extrabold tracking-tight">{r.name}</h3>
              <div className="mt-1.5 text-sm text-muted">Unit {r.n} · Ch {realmChapterLabel(r)} · {r.biome}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted/90">{r.description}</p>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: r.color }}>{done === 0 ? <Lock className="size-3" /> : "🏅"} {r.badge}</span>
                <span className="font-mono text-muted">{done}/{tasks.length}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${r.color}, color-mix(in srgb, ${r.color} 40%, white))` }} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
