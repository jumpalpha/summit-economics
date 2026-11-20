import Link from "next/link";
import { chapters, realms } from "@/data/site";
import { SITE } from "@/data/config";
import { VisitCount } from "@/components/x7b/visit-count";
import { InstallButton } from "@/components/x7b/pwa";
import { MountainRange } from "@/components/mountains";

const cols = [
  { title: "Explore", links: [["Trail Map", "/"], ["All Chapters", "/chapters/"], ["Glossary", "/glossary/"], ["Side Quests", "/side-quests/"]] },
  { title: "Students", links: [["My Climb", "/quest/"], ["Unit Tests", "/tests/"], ["Pick a Side", "/pick-a-side/"], ["Survey of the Day", "/survey/"],
    ["Welcome Back", "/welcome/"], ["Print Climb Sheet", "/print-quest/"], ["Suggest an Improvement", "/suggest/"]] },
  { title: "Learn", links: [["Vocab Games", "/vocab/"], ["Review Deck", "/review/"], ["Mastery Checks", "/mastery/"], ["Search", "/search/"], [`Ask ${SITE.teacher}`, "/ask/"]] },
  { title: "Adults", links: [["Teacher Dashboard", "/teacher/"], ["Parents & Guardians", "/parents/"], ["Sub Guide", "/sub-guide/"]] },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-line bg-ink-2/60 backdrop-blur">
      <MountainRange className="pointer-events-none absolute inset-x-0 -top-[58px] h-[60px] w-full text-ink-2/60" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <div className="font-display text-2xl font-extrabold"><span className="text-gradient">{SITE.fullName}</span></div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {SITE.teacherPossessive} economics class at {SITE.school}. {chapters.length} chapters, {realms.length} units, one climb from the trailhead to the summit.
          </p>
          <p className="mt-5 font-mono text-xs tracking-wider text-muted/70">{SITE.hashtag} · Every choice has a cost</p>
          <div className="mt-5"><InstallButton /></div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sky/80">{c.title}</div>
            <ul className="space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-muted transition hover:text-fg">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-6 py-6 text-center text-xs text-muted/60">{SITE.fullName} · {SITE.domain}<VisitCount /></div>
    </footer>
  );
}
