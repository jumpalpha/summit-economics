import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Gamepad2, Lightbulb, PenLine } from "lucide-react";
import { chapterById, chapters, realmForChapter, sectionAnchors } from "@/data/site";
import { Eyebrow, Md, PageHead } from "@/components/ui";
import { TaskCheck } from "@/components/task-check";
// ── wave-learnA: chapter tools ──
import { ChapterPath, QcNudge, QuickCheck, ReadingIntro, ReadingTracker, VocabGameLinks } from "@/components/chapter-tools";
import { quickChecksFor } from "@/data/learn";

export const dynamicParams = false;
export function generateStaticParams() { return chapters.map((c) => ({ n: c.id })); }
export async function generateMetadata({ params }: PageProps<"/chapters/[n]">): Promise<Metadata> {
  const { n } = await params;
  const c = chapterById(n);
  return { title: c ? `Chapter ${c.label}: ${c.title}` : "Chapter" };
}

export default async function ChapterPage({ params }: PageProps<"/chapters/[n]">) {
  const c = chapterById((await params).n);
  if (!c) notFound();
  const n = c.id;
  const r = realmForChapter(n);
  const at = chapters.indexOf(c);
  const prev = chapters[at - 1], next = chapters[at + 1];
  const anchors = sectionAnchors(c);
  const qcs = quickChecksFor(c); // wave-learnA
  let part = "";

  return (
    <>
      <PageHead eyebrow={`Unit ${r.n}: ${r.name} · Chapter ${c.label}`} title={c.title}>
        {c.standards && c.standards.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
            <span className="font-mono uppercase tracking-[0.18em]">Idaho standards</span>
            {c.standards.map((s) => <span key={s} className="rounded-md border border-line bg-white/[0.04] px-2 py-0.5 font-mono text-fg">{s}</span>)}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#think" className="btn-block"><Lightbulb className="size-5" /> Think Like an Economist</a>
          <Link href={`/chapters/${n}/quiz/`} className="btn-block btn-grass"><PenLine className="size-5" /> Chapter quiz</Link>
          {/* ── wave-learnA ── */}
          <a href="#vocab" className="btn-block"><Gamepad2 className="size-5" /> Vocab games</a>
          <a href="#path" className="btn-block lg:!hidden">Chapter Path</a>
        </div>
      </PageHead>

      {/* ── wave-learnA: reading + Chapter Path sidebar ── */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article id="reading" className="min-w-0 max-w-3xl scroll-mt-28">
        <ReadingTracker chId={n} anchors={anchors} />
        <ReadingIntro count={c.sections.length} qcCount={qcs.filter((l) => l.length).length} />
        {c.sections.map((s, i) => {
          const showPart = s.part && s.part !== part;
          if (s.part) part = s.part;
          return (
            <section key={i} id={anchors[i]} className="mb-8 scroll-mt-24">
              {i > 0 && <QcNudge n={i - 1} qs={qcs[i - 1]} />}
              {showPart && <div className="mb-6 border-y border-line py-2 text-center font-pixel text-xs uppercase">{s.part}</div>}
              <h2 className="pixel-title text-2xl sm:text-3xl">{s.heading}</h2>
              <Md text={s.markdown} />
              <QuickCheck chId={n} n={i} heading={s.heading} qs={qcs[i]} last={i === c.sections.length - 1} />
            </section>
          );
        })}

        <section className="block-panel mb-8 p-6">
          <Eyebrow>Trail checklist</Eyebrow>
          <ul className="space-y-2">{c.checklist.map((x, i) => <li key={i} className="flex gap-2 font-semibold"><span className="text-sky">▲</span><Md text={x} /></li>)}</ul>
          <div className="mt-6"><TaskCheck taskKey={`ch${n}_read`} label="I read this chapter" /></div>
        </section>

        <section id="think" className="block-panel mb-8 scroll-mt-24 p-6" style={{ borderColor: r.color }}>
          <Eyebrow color={r.color}>Think Like an Economist</Eyebrow>
          <Md text={c.thinkLikeAScientist.prompt} />
          <div className="mt-3 text-sm font-semibold text-muted"><Md text={c.thinkLikeAScientist.standards} /></div>
          <p className="mt-3 text-sm font-bold">Write your answer in your notebook or class assignment, then check it off here.</p>
          <div className="mt-4"><TaskCheck taskKey={`ch${n}_tls`} label="I finished my answer" /></div>
        </section>

        <section className="mb-8">
          <Eyebrow>Key words</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {c.keyWords.map((w) => <Link key={w} href={`/glossary/?q=${encodeURIComponent(w)}`} className="rounded-lg border border-line bg-white/[0.04] px-2.5 py-1 text-sm font-bold hover:bg-grass/25">{w}</Link>)}
          </div>
        </section>

        {/* ── wave-learnA: vocab games ── */}
        <section id="vocab" className="mb-8 scroll-mt-24">
          <Eyebrow>Vocabulary games</Eyebrow>
          <VocabGameLinks chId={n} />
        </section>

        <div className="flex justify-between gap-3 border-t border-line pt-6">
          {prev ? <Link href={`/chapters/${prev.id}/`} className="btn-block !text-sm"><ArrowLeft className="size-4" /> Ch {prev.label}</Link> : <span />}
          <Link href={`/chapters/${n}/quiz/`} className="btn-block btn-grass !text-sm">Take the quiz</Link>
          {next ? <Link href={`/chapters/${next.id}/`} className="btn-block !text-sm">Ch {next.label} <ArrowRight className="size-4" /></Link> : <span />}
        </div>
      </article>
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"><ChapterPath chId={n} /></aside>
      </div>
    </>
  );
}
