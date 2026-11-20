"use client";

import { Check } from "lucide-react";
import { dbReady } from "@/lib/db";
import { useProgress } from "@/lib/progress";

/** Self-check button for reading and Think Like an Economist tasks (quiz/test tasks check themselves). */
export function TaskCheck({ taskKey, label }: { taskKey: string; label: string }) {
  const { signedIn, stats, check } = useProgress();
  const done = stats.done.has(taskKey);
  if (!dbReady || !signedIn) return <span className="text-sm font-bold text-muted">Log in to check this off for +25 XP.</span>;
  return done ? (
    <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-emerald px-3 py-2 font-extrabold text-black"><Check className="size-4" /> Done · +25 XP</span>
  ) : (
    <button onClick={() => check(taskKey)} className="btn-block btn-grass">{label} · +25 XP</button>
  );
}
