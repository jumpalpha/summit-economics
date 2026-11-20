import type { Metadata } from "next";
import { chapters, chaptersIn, realms } from "@/data/site";
import { ChapterCard, Eyebrow, PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Chapters" };

export default function ChaptersPage() {
  return (
    <>
      <PageHead eyebrow="The trail guide" title={`All ${chapters.length} chapters`} sub={`${chapters.length} chapters across ${realms.length} units. Read, pass the quiz, then think like an economist.`} />
      <div className="mx-auto max-w-7xl space-y-14 px-6 pt-12">
        {realms.map((r) => (
          <section key={r.n}>
            <Eyebrow color={r.color}>Unit {r.n} · {r.biome}</Eyebrow>
            <h2 className="pixel-title text-3xl">{r.icon} {r.name}</h2>
            <p className="mt-1 max-w-3xl font-semibold text-muted">{r.tagline}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {chaptersIn(r).map((c) => <ChapterCard key={c.id} ch={c} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
