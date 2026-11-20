"use client";
// ── wave-learnA: Search box + results (same behavior as Dopps Class search.html) ──
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export type Hit = { type: "Chapter" | "Realm" | "Word" | "Game" | "Page"; icon: string; title: string; desc: string; url: string; keys?: string };
const FILTERS: { type: Hit["type"] | "All"; label: string }[] = [
  { type: "All", label: "All" }, { type: "Chapter", label: "Chapters" }, { type: "Word", label: "Key words" },
  { type: "Realm", label: "Units" }, { type: "Page", label: "Pages" },
];

function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded bg-gold/35 px-0.5 text-fg">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

export function SiteSearch({ index }: { index: Hit[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<Hit["type"] | "All">("All");
  const input = useRef<HTMLInputElement>(null);
  // ?q= deep links (e.g. from the nav)
  useEffect(() => { const p = new URLSearchParams(location.search).get("q"); if (p) setQ(p); input.current?.focus(); }, []);
  useEffect(() => { const t = setTimeout(() => history.replaceState(null, "", q.trim() ? `?q=${encodeURIComponent(q.trim())}` : location.pathname), 300); return () => clearTimeout(t); }, [q]);

  const s = q.trim().toLowerCase();
  const results = useMemo(() => {
    let r = index.filter((h) => type === "All" || h.type === type);
    if (s) {
      const score = (h: Hit) => (h.title.toLowerCase() === s ? 0 : h.title.toLowerCase().startsWith(s) ? 1 : h.title.toLowerCase().includes(s) ? 2 : 3);
      r = r.filter((h) => h.title.toLowerCase().includes(s) || h.desc.toLowerCase().includes(s) || h.type.toLowerCase().includes(s) || (h.keys ?? "").toLowerCase().includes(s))
        .sort((a, b) => score(a) - score(b));
    }
    return r;
  }, [index, s, type]);
  const idle = !s && type === "All";
  const shown = idle ? results.filter((h) => h.type !== "Word").slice(0, 24) : results.slice(0, 200);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <label className="sticky top-20 z-10 flex items-center gap-3 rounded-2xl border border-line bg-ink px-4 py-3 shadow-lg">
        <Search className="size-5 shrink-0 text-muted" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chapters, words, games…" aria-label="Search chapters, key words, realms, games and pages"
          autoComplete="off" className="w-full min-w-0 bg-transparent text-lg font-bold outline-none placeholder:text-muted" />
        {q && <button onClick={() => { setQ(""); input.current?.focus(); }} aria-label="Clear search" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:text-fg"><X className="size-4" /></button>}
      </label>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter results by type">
        {FILTERS.map((f) => (
          <button key={f.type} aria-pressed={type === f.type} onClick={() => setType(f.type)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${type === f.type ? "border-gold bg-gold/20 text-fg" : "border-line text-muted hover:text-fg"}`}>{f.label}</button>
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold text-muted">
        {idle ? `${index.length} items indexed. Start typing to search.` : `${results.length} ${results.length === 1 ? "result" : "results"}${results.length > shown.length ? ` (showing ${shown.length})` : ""}`}
      </p>
      {shown.length ? (
        <ul className="mt-3 space-y-2">
          {shown.map((h) => (
            <li key={h.type + h.url + h.title}>
              <Link href={h.url} className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-gold/50">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-2/60 text-2xl" aria-hidden>{h.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-snug"><Mark text={h.title} q={s} /></span>
                  {h.desc && <span className="mt-0.5 line-clamp-2 block text-sm text-muted"><Mark text={h.desc} q={s} /></span>}
                </span>
                <span className="hidden shrink-0 rounded-full border border-line px-2.5 py-0.5 text-xs font-bold text-muted sm:inline">{h.type === "Word" ? "Key word" : h.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-16 text-center font-bold text-muted"><div className="text-4xl" aria-hidden>🔍</div>No matches. Try a different word.</div>
      )}
    </div>
  );
}
