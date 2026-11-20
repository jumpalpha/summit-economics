"use client";

import { useState } from "react";
import data from "@/data/content/pick_a_side.json";
import { chapters, realmForChapter } from "@/data/site";
import { Eyebrow, PageHead } from "@/components/ui";
import { VoteBox } from "@/components/vote-box";

type D = { id: string; chapter: number | string; question: string; sideA: string; sideB: string; rating: "Green" | "Yellow" | "Red" };
const debates = data.debates as D[];
const ratingColor = { Green: "#22c55e", Yellow: "#eab308", Red: "#ef4444" };

export default function PickASide() {
  const [ch, setCh] = useState<string | null>(null);
  const list = ch ? debates.filter((d) => String(d.chapter) === ch) : debates;
  return (
    <>
      <PageHead eyebrow="Pick a Side" title="Two sides. Back yours up." sub={data.intro.replace(/ Rating key:$/, "")}>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          {Object.entries(data.ratingKey).map(([k, v]) => (
            <span key={k} className="rounded-lg border border-line bg-white/[0.04] px-2.5 py-1"><span style={{ color: ratingColor[k as D["rating"]] }}>■</span> {k}: {v}</span>
          ))}
        </div>
      </PageHead>
      <div className="mx-auto max-w-4xl px-6 pt-10">
        <select value={ch ?? ""} onChange={(e) => setCh(e.target.value || null)} className="mb-6 w-full rounded-xl border border-line bg-ink px-3 py-2 font-bold">
          <option value="">All chapters ({debates.length} debates)</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>Chapter {c.label}: {c.title}</option>)}
        </select>
        <div className="space-y-5">
          {list.map((d) => (
            <div key={d.id} className="block-panel p-5" style={{ borderLeftWidth: 10, borderLeftColor: ratingColor[d.rating] }}>
              <Eyebrow color={realmForChapter(d.chapter).color}>Chapter {String(d.chapter).toUpperCase()} · {d.rating}</Eyebrow>
              <h2 className="pixel-title mb-4 text-xl sm:text-2xl">{d.question}</h2>
              <VoteBox kind="debate" item={d.id} options={[d.sideA, d.sideB]} reasonLabel="Your reasoning from the chapter…" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
