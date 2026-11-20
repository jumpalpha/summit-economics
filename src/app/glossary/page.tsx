"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import glossary from "@/data/content/glossary.json";
import { PageHead } from "@/components/ui";
import { chapters } from "@/data/site";

type Term = { term: string; definition: string; chapter?: number | string };
const all = (glossary as Term[]).slice().sort((a, b) => a.term.localeCompare(b.term));

export default function Glossary() {
  const [q, setQ] = useState("");
  useEffect(() => { const p = new URLSearchParams(location.search).get("q"); if (p) setQ(p); }, []);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? all.filter((t) => t.term.toLowerCase().includes(s) || t.definition.toLowerCase().includes(s)) : all;
  }, [q]);
  return (
    <>
      <PageHead eyebrow="Glossary" title="Every key word" sub={`${all.length} terms from all ${chapters.length} chapters.`} />
      <div className="mx-auto max-w-4xl px-6 pt-10">
        <label className="sticky top-20 z-10 flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3">
          <Search className="size-5 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word…" className="w-full bg-transparent font-bold outline-none" />
        </label>
        <dl className="mt-6 divide-y-2 divide-line">
          {list.map((t, i) => (
            <div key={t.term + i} className="py-3">
              <dt className="font-extrabold">{t.term} {t.chapter && <Link href={`/chapters/${t.chapter}/`} className="ml-2 font-pixel text-[9px] text-grass">CH {String(t.chapter).toUpperCase()}</Link>}</dt>
              <dd className="text-muted">{t.definition}</dd>
            </div>
          ))}
        </dl>
        {list.length === 0 && <p className="py-16 text-center font-bold text-muted">No words match “{q}”.</p>}
      </div>
    </>
  );
}
