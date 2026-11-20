import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { realmForChapter, type Chapter } from "@/data/site";
import { ArtIcon } from "@/components/art-icon";

export function Eyebrow({ children, color = "var(--color-gold)" }: { children: ReactNode; color?: string }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color }}>
      <span className="h-px w-6" style={{ background: color }} />
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
        {sub && <p className="mt-4 text-lg leading-relaxed text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** Page header used by every inner page (the nav floats above it). */
export function PageHead({ eyebrow, title, sub, art, children }: { eyebrow: string; title: ReactNode; sub?: ReactNode; art?: { slug: string; fallback: string }; children?: ReactNode }) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-6 pt-32 sm:pt-36">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="animate-rise font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
          {sub && <p className="mt-5 max-w-2xl animate-rise text-lg leading-relaxed text-muted [animation-delay:80ms]">{sub}</p>}
          {children}
        </div>
        {art && (
          <div className="relative hidden shrink-0 animate-float md:block" aria-hidden>
            <span className="absolute inset-6 rounded-full bg-gold/25 blur-2xl" />
            <ArtIcon slug={art.slug} fallback={art.fallback} size={180} className="relative" />
          </div>
        )}
      </div>
    </section>
  );
}

export function ChapterCard({ ch, done }: { ch: Chapter; done?: boolean }) {
  const realm = realmForChapter(ch.id);
  return (
    <Link href={`/chapters/${ch.id}/`} style={{ "--accent": realm.color } as CSSProperties} className="accent-card group flex flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <span className="font-display text-5xl font-extrabold leading-none tracking-tighter" style={{ color: realm.color }}>{ch.label.padStart(2, "0")}</span>
        {done ? <span className="rounded-full bg-emerald/15 px-2.5 py-1 text-[11px] font-bold text-emerald">✓ Read</span>
          : <ArrowUpRight className="size-5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />}
      </div>
      <h3 className="mt-4 text-[17px] font-bold leading-snug">{ch.title}</h3>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-0.5 text-xs font-medium text-muted">{realm.icon} {realm.name}</span>
      </div>
    </Link>
  );
}

export function Btn({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  const cls = variant === "primary"
    ? "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber to-[#e0662f] px-6 py-3.5 font-bold text-[#10140e] shadow-[0_10px_40px_-10px_rgba(242,140,40,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-10px_rgba(242,140,40,0.9)]"
    : "glass inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-fg transition hover:-translate-y-0.5 hover:bg-white/10";
  return href.startsWith("http") ? <a href={href} className={cls}>{children}</a> : <Link href={href} className={cls}>{children}</Link>;
}

/** Tiny markdown for chapter text: paragraphs, "- " bullets, "1. " lists, **bold**, *italic*. */
export function Md({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((t, i) => <li key={i}>{inline(t)}</li>);
    out.push(list.type === "ul" ? <ul key={out.length}>{items}</ul> : <ol key={out.length}>{items}</ol>);
    list = null;
  };
  for (const raw of lines) {
    const l = raw.trim();
    const ul = l.match(/^[-*] (.*)/), ol = l.match(/^\d+\. (.*)/);
    if (ul || ol) {
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) { flush(); list = { type, items: [] }; }
      list.items.push((ul ?? ol)![1]);
    } else {
      flush();
      if (l) out.push(<p key={out.length}>{inline(l)}</p>);
    }
  }
  flush();
  return <div className="prose-block">{out}</div>;
}
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((p, i) =>
    p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p);
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="block-panel border-amber/40 p-4 text-sm font-semibold">{children}</div>;
}
