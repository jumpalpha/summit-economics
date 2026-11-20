// For Parents & Guardians: what Summit is, how XP, trail ranks and units work, how to help at home, and data privacy.
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { chapters, realmChapterLabel, realms, ranks, requiredTasks, SIDE_QUESTS_PER_TERM, XP_PER_DAY, XP_PER_SIDE_QUEST, XP_PER_TASK } from "@/data/site";
import { SITE, TEACHER_CONTACT } from "@/data/config";
import { Eyebrow, PageHead, SectionHeading } from "@/components/ui";
import { ArtIcon } from "@/components/art-icon";

export const metadata: Metadata = {
  title: "Parents & Guardians",
  description: `What ${SITE.fullName} is, how XP, trail ranks and units work, how to help your student at home, and how student data is handled.`,
};

const requiredCount = realms.reduce((n, r) => n + requiredTasks(r).length, 0);

const features = [
  { icon: "📖", title: `${chapters.length} chapters`, text: "Every chapter is on the site in plain language, with Idaho examples, key words, and a Think Like an Economist challenge." },
  { icon: "🗺️", title: `${realms.length} units`, text: "Chapters are grouped into themed units along a mountain trail. Clearing every task in a unit earns its badge and the next trail rank." },
  { icon: "✅", title: "Idaho standards", text: "The course covers all 24 Idaho high school economics standards (9-12.EC.1 to 9-12.EC.24). Each chapter lists the standards it teaches." },
  { icon: "💵", title: "Real-life money skills", text: "A full unit on budgeting, smart shopping, college costs, credit scores, and insurance: the personal finance Idaho requires." },
];
const help = [
  { icon: "🛒", title: "Shop together", text: "Compare unit prices at the grocery store, or look at the receipt together and find the 6% sales tax." },
  { icon: "🧾", title: "Show a real bill or pay stub", text: "With personal numbers covered, let your student see a utility bill, a pay stub, or an insurance card. It makes Units 4 and 5 real." },
  { icon: "🎯", title: "Set a savings goal", text: "Help your student pick one SMART savings goal and a plan to reach it. Chapter 13 walks through how." },
  { icon: "📰", title: "Talk about the news", text: "Gas prices, interest rates, tariffs, a new business in town: ask, \"What's the economics here?\" There's almost always an answer in the chapters." },
];
const faqs: [string, string][] = [
  ["Why is economics taught like a climb?", "Students respond to clear goals and visible progress. Every chapter is a step up the trail, every unit is a stretch with a badge at the end, and the ranks show how far they've come. The content itself is a standard high school economics course."],
  ["How is my student graded?", `Grades are set by ${SITE.teacher} and follow school policy. XP and ranks are there to motivate. Chapter quizzes and unit tests are graded automatically by the site, and the teacher can see every score.`],
  ["What does the course cover?", "Fundamental concepts (scarcity, supply and demand, economic systems), business and labor, money and banking, personal finance, the whole economy (GDP, inflation, the business cycle), government taxes and the Federal Reserve, and international trade, all aligned to the Idaho content standards."],
  ["Does the site take a political side?", "No. Topics like taxes, the minimum wage, and tariffs are real debates, and the chapters present the main arguments on each side. Students practice backing up their own view with economic reasoning."],
  ["Who do I contact with a concern?", `Please contact ${SITE.teacher} (see the contact box). Anyone can also use Suggest an Improvement to report a problem with the site.`],
];
const links = [
  { href: "/", icon: "🏔️", title: "Student home page", text: "The trail map and every unit" },
  { href: "/chapters/", icon: "📖", title: "All chapters", text: "Read anything, no account needed" },
  { href: "/realms/5/", icon: "🧗", title: "Unit 5: Switchbacks", text: "Budgets, credit scores, insurance" },
  { href: "/glossary/", icon: "📚", title: "Glossary", text: "Every key word in the course" },
  { href: "/side-quests/", icon: "⛺", title: "Side Quests", text: "Real-world projects students can do with family" },
  { href: "/survey/", icon: "📊", title: "Survey of the Day", text: "Fun polls students vote on" },
];

export default function Parents() {
  return (
    <>
      <PageHead eyebrow="For parents & guardians" title={<>Welcome to <span className="text-gradient">{SITE.name}</span></>}
        sub={`What your student is learning in ${SITE.teacherPossessive} economics class, how the course works, and how you can help at home.`}
        art={{ slug: "", fallback: "🏔️" }}>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
          <span className="text-3xl">🧑‍🏫</span><span><b className="block">{SITE.teacher}</b><span className="text-sm text-muted">Economics · {SITE.school}</span></span>
        </div>
      </PageHead>

      <div className="mx-auto max-w-7xl space-y-24 px-6 pt-12">
        <section>
          <SectionHeading eyebrow="About the course" title={`What is ${SITE.name}?`}
            sub={`${SITE.fullName} is a high school economics course for ${SITE.grades.toLowerCase()}, built like a mountain climb. Students work through ${chapters.length} chapters in ${realms.length} units, from the trailhead (scarcity and choice) to the summit (the global economy).`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="block-panel p-5"><div className="text-3xl">{f.icon}</div><h3 className="mt-2 text-lg font-extrabold">{f.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p></div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="How it works" title="XP, trail ranks and units" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="block-panel p-5">
              <Eyebrow>XP</Eyebrow>
              <ul className="space-y-2 text-sm leading-relaxed">
                <li><b>{XP_PER_TASK} XP</b> for each task: reading a chapter, passing its quiz (80%+), its Think Like an Economist challenge, and each unit test (70%+).</li>
                <li><b>{XP_PER_DAY} XP</b> for every day the student logs in.</li>
                <li><b>{XP_PER_SIDE_QUEST} XP</b> for each side quest {SITE.teacher} approves ({SIDE_QUESTS_PER_TERM} per term).</li>
              </ul>
            </div>
            <div className="block-panel p-5">
              <Eyebrow>Units & badges</Eyebrow>
              <p className="text-sm leading-relaxed">Each unit has a task list ({requiredCount} tasks in all). When every task in a unit is done, the student earns that unit&apos;s badge. Badges stay earned even if new chapters are added later.</p>
            </div>
            <div className="block-panel p-5">
              <Eyebrow>Trail ranks</Eyebrow>
              <p className="text-sm leading-relaxed">Every unit cleared moves the student up one rank: {ranks.map((r) => r.name).join(" → ")}. Clearing all {realms.length} units makes them a <b>Summiteer</b>.</p>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Course content" title={`The ${realms.length} units`} sub="The course starts with how economists think, moves through markets, business, money and personal finance, then zooms out to the whole economy, government, and the world." />
          <div className="space-y-3">
            {realms.map((r) => (
              <details key={r.n} className="accent-card group rounded-2xl p-4" style={{ "--accent": r.color } as CSSProperties}>
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <ArtIcon fallback={r.icon} size={44} />
                  <span className="min-w-0 flex-1"><b className="block font-display text-lg">Unit {r.n}: {r.name}</b><span className="text-xs text-muted">Chapters {realmChapterLabel(r)} · {r.badge}</span></span>
                  <span className="text-muted transition group-open:rotate-90">▶</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{r.description}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {chapters.filter((c) => c.realm === r.n).map((c) => <li key={c.id} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold">Ch {c.label}: {c.title}</li>)}
                </ul>
              </details>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="At home" title="How can I help my student?" sub="Economics sticks best when it shows up in real life. A few easy ways to keep it going:" />
          <div className="grid gap-4 sm:grid-cols-2">
            {help.map((h) => (
              <div key={h.title} className="block-panel flex gap-4 p-5"><span className="text-3xl">{h.icon}</span><div><h3 className="font-extrabold">{h.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{h.text}</p></div></div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="block-panel p-6" id="contact">
            <Eyebrow>Contact</Eyebrow>
            <h2 className="font-display text-2xl font-extrabold">Reach {SITE.teacher}</h2>
            {TEACHER_CONTACT ? (
              <ul className="mt-3 space-y-1.5">{TEACHER_CONTACT.map((c) => <li key={c.label}><b>{c.label}:</b> {c.href ? <a className="underline" href={c.href}>{c.value}</a> : c.value}</li>)}</ul>
            ) : (
              <div className="mt-3 rounded-xl border-2 border-dashed border-amber/60 bg-amber/10 p-4 text-sm" data-testid="contact-placeholder">
                <b className="text-amber">Contact details coming soon.</b> For now, please use your school&apos;s usual way of contacting teachers.
              </div>
            )}
            <p className="mt-3 text-sm text-muted">Have an idea for the site? Anyone can use <Link href="/suggest/" className="underline">Suggest an Improvement</Link>.</p>
          </div>
          <div className="block-panel p-6">
            <Eyebrow>Privacy & data</Eyebrow>
            <h2 className="font-display text-2xl font-extrabold">What we store</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              <li>The whole site is public. Any parent can read every chapter without an account.</li>
              <li>The progress tracker uses a simple login: first name and last initial, class period, and a 4-digit PIN the student chooses (stored only as a scrambled hash) in a secure US-based cloud database (Supabase).</li>
              <li>No email, phone number, address, or financial information is collected.</li>
              <li>Quiz answer keys are kept in the database and are never shown on the site.</li>
            </ul>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Questions" title="Parents ask us" />
          <div className="space-y-2">
            {faqs.map(([q, a]) => (
              <details key={q} className="block-panel group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<span className="text-xl text-muted transition group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Explore the site" title="Jump right in" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="accent-card flex items-center gap-4 rounded-2xl p-4" style={{ "--accent": "#38bdf8" } as CSSProperties}>
                <span className="text-3xl">{l.icon}</span><span><b className="block">{l.title}</b><span className="text-sm text-muted">{l.text}</span></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
