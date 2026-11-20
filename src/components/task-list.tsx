"use client";

import Link from "next/link";
import { Check, Square } from "lucide-react";
import { realmTasks, type Realm } from "@/data/site";
import { useProgress } from "@/lib/progress";

export function TaskList({ realm }: { realm: Realm }) {
  const { stats, signedIn, check } = useProgress();
  return (
    <ul className="space-y-2">
      {realmTasks(realm).map((t) => {
        const done = stats.done.has(t.key);
        return (
          <li key={t.key} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${done ? "border-emerald bg-emerald/15" : "border-line"}`}>
            {done ? <Check className="size-5 shrink-0 text-emerald" /> : <Square className="size-5 shrink-0 text-muted" />}
            <Link href={t.href} className="flex-1 font-bold hover:underline">{t.label}</Link>
            {!done && signedIn && !t.auto && <button onClick={() => check(t.key)} className="rounded-lg border border-line bg-grass px-2 py-0.5 text-xs font-extrabold text-white">Done</button>}
            {!done && t.auto && <span className="text-[11px] font-extrabold uppercase text-muted">auto</span>}
            <span className="font-pixel text-[9px] text-muted">25XP</span>
          </li>
        );
      })}
    </ul>
  );
}
