import type { Metadata } from "next";
import { notFound } from "next/navigation";
import questions from "@/data/content/questions.json";
import { chapterById, chapters, realmForChapter } from "@/data/site";
import { PageHead } from "@/components/ui";
import { Quiz, type Q } from "@/components/quiz";

export const dynamicParams = false;
export function generateStaticParams() { return chapters.map((c) => ({ n: c.id })); }
export const metadata: Metadata = { title: "Chapter quiz" };

export default async function ChapterQuiz({ params }: PageProps<"/chapters/[n]/quiz">) {
  const c = chapterById((await params).n);
  if (!c) notFound();
  const n = c.id;
  const qs = (questions.chapter as Record<string, Q[]>)[n] ?? [];
  return (
    <>
      <PageHead eyebrow={`Realm ${realmForChapter(n).n} · Chapter ${c.label} quiz`} title={c.title} />
      <div className="px-4 pt-10"><Quiz kind="chapter" refN={c.ref} questions={qs} title={`Chapter ${c.label} quiz`} passPct={80} backHref={`/chapters/${n}/`} /></div>
    </>
  );
}
