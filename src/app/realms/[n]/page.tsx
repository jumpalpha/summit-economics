import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chaptersIn, realmChapterLabel, realms } from "@/data/site";
import { ChapterCard, Eyebrow, PageHead } from "@/components/ui";
import { TaskList } from "@/components/task-list";

export const dynamicParams = false;
export function generateStaticParams() { return realms.map((r) => ({ n: String(r.n) })); }
export const metadata: Metadata = { title: "Unit" };

export default async function RealmPage({ params }: PageProps<"/realms/[n]">) {
  const { n } = await params;
  const r = realms.find((x) => x.n === Number(n));
  if (!r) notFound();
  return (
    <>
      <PageHead eyebrow={`Unit ${r.n} · ${r.biome} · Chapters ${realmChapterLabel(r)}`} title={<>{r.icon} {r.name}</>} sub={r.description}>
        <p className="mt-3 max-w-2xl font-semibold italic text-muted">{r.tagline}</p>
      </PageHead>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-12 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <Eyebrow color={r.color}>Chapters</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">{chaptersIn(r).map((c) => <ChapterCard key={c.id} ch={c} />)}</div>
          <Link href={`/tests/${r.n}/`} className="btn-block btn-grass mt-6">🏔 {r.testTitle}</Link>
        </section>
        <section className="block-panel p-5">
          <Eyebrow color={r.color}>Clear the unit</Eyebrow>
          <p className="mb-4 font-bold">Finish every task to earn the <span style={{ color: r.color }}>{r.badge}</span> and climb one trail rank.</p>
          <TaskList realm={r} />
        </section>
      </div>
    </>
  );
}
