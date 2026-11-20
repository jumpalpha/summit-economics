import type { Metadata } from "next";
import { notFound } from "next/navigation";
import questions from "@/data/content/questions.json";
import { realmChapterLabel, realms } from "@/data/site";
import { PageHead } from "@/components/ui";
import { Quiz, type Q } from "@/components/quiz";

export const dynamicParams = false;
export function generateStaticParams() { return realms.map((r) => ({ n: String(r.n) })); }
export const metadata: Metadata = { title: "Unit test" };

export default async function UnitTest({ params }: PageProps<"/tests/[n]">) {
  const n = Number((await params).n);
  const r = realms.find((x) => x.n === n);
  if (!r) notFound();
  const qs = (questions.unit as Record<string, Q[]>)[String(n)];
  return (
    <>
      <PageHead eyebrow={`Unit ${n} test`} title={r.testTitle} sub={`Covers chapters ${realmChapterLabel(r)}.`} />
      <div className="px-4 pt-10"><Quiz kind="unit" refN={n} questions={qs} title={r.testTitle} passPct={70} backHref={`/realms/${n}/`} /></div>
    </>
  );
}
