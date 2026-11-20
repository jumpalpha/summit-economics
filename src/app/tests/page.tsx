import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { realmChapterLabel, realms } from "@/data/site";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Unit Tests" };

export default function Tests() {
  return (
    <>
      <PageHead eyebrow="Summit pushes" title="Unit tests" sub="One per unit. 30 questions, auto-graded, choices shuffled every time. Pass with 70% to clear the unit." />
      <div className="mx-auto grid max-w-7xl gap-4 px-6 pt-12 sm:grid-cols-3">
        {realms.map((r) => (
          <Link key={r.n} href={`/tests/${r.n}/`} style={{ "--accent": r.color } as CSSProperties} className="accent-card p-5 pt-6">
            <div className="text-3xl">{r.icon}</div>
            <div className="pixel-title mt-2 text-2xl">{r.testTitle}</div>
            <div className="mt-1 text-sm font-bold text-muted">Chapters {realmChapterLabel(r)} · 30 questions</div>
          </Link>
        ))}
      </div>
    </>
  );
}
