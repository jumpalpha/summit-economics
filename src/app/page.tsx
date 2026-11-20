import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight, BarChart3, BookOpen, ClipboardCheck, Compass, Flag, GraduationCap, Hand, Layers, Map as MapIcon, Medal, MessageCircleQuestion,
  Mountain, Printer, Search, SpellCheck, Sparkles, Star, Swords, Tent, Users,
} from "lucide-react";
import { chapters, realms } from "@/data/site";
import questions from "@/data/content/questions.json";
import glossary from "@/data/content/glossary.json";
import pickASide from "@/data/content/pick_a_side.json";
import { SITE } from "@/data/config";
import { Btn, ChapterCard, Eyebrow, SectionHeading } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { WorldMap } from "@/components/world-map";
import { TrailProfile } from "@/components/trail-profile";
import { InstallButton } from "@/components/x7b/pwa";

const quizCount = Object.values(questions.chapter).flat().length + Object.values(questions.unit).flat().length;

const heroChips = [
  { n: String(chapters.length), label: "Chapters", color: "#84cc16", icon: BookOpen },
  { n: String(realms.length), label: "Units", color: "#38bdf8", icon: MapIcon },
  { n: "24", label: "Idaho standards", color: "#f6c453", icon: Flag },
  { n: "9", label: "Trail ranks", color: "#a78bfa", icon: Mountain },
];
const stats = [
  { n: String(chapters.length), label: "Chapters", color: "#84cc16" },
  { n: String(quizCount), label: "Quiz questions", color: "#38bdf8" },
  { n: String(glossary.length), label: "Key words", color: "#f6c453" },
  { n: "▲9", label: "Ranks to climb", color: "#a78bfa" },
];
const quickLinks = [
  { label: "My Climb", desc: "XP, ranks, badges, checklist", href: "/quest/", icon: ClipboardCheck, color: "#f6c453" },
  { label: "Survey of the Day", desc: "Vote, then see the class", href: "/survey/", icon: BarChart3, color: "#38bdf8" },
  { label: "Pick a Side", desc: `${pickASide.debates.length} debates, bring reasons`, href: "/pick-a-side/", icon: Swords, color: "#f25c45" },
  { label: "Unit Tests", desc: "One summit push per unit", href: "/tests/", icon: Medal, color: "#a78bfa" },
  { label: "Glossary", desc: `${glossary.length} key words`, href: "/glossary/", icon: BookOpen, color: "#60a5fa" },
  { label: "Side Quests", desc: "Real-world economics", href: "/side-quests/", icon: Tent, color: "#34d399" },
  { label: "Vocab Games", desc: "Flashcards and speed quizzes", href: "/vocab/", icon: SpellCheck, color: "#38bdf8" },
  { label: "Review Deck", desc: "Practice what you missed", href: "/review/", icon: Layers, color: "#f28c28" },
  { label: "Mastery Checks", desc: "Warm up before the quiz", href: "/mastery/", icon: GraduationCap, color: "#34d399" },
  { label: "Search", desc: "Chapters and key words", href: "/search/", icon: Search, color: "#a78bfa" },
  { label: `Ask ${SITE.teacher}`, desc: "Anonymous questions", href: "/ask/", icon: MessageCircleQuestion, color: "#f6c453" },
  { label: "Welcome Back", desc: "Check in and see what's next", href: "/welcome/", icon: Hand, color: "#84cc16" },
  { label: "Print Climb Sheet", desc: "Every task on paper", href: "/print-quest/", icon: Printer, color: "#94a3b8" },
  { label: "Parents & Guardians", desc: "What this class covers", href: "/parents/", icon: Users, color: "#c084fc" },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-14 pt-32 lg:grid-cols-[1.15fr_1fr] lg:pt-40">
        <div className="relative">
          <div className="glass inline-flex animate-rise items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-sky">
              <span className="hero-live" /> Trail is open
            </span>
            {SITE.teacherPossessive} Economics
          </div>

          <h1 className="mt-7 animate-rise font-display text-[clamp(3.4rem,9vw,7.25rem)] font-extrabold leading-[0.9] tracking-[-0.045em] [animation-delay:80ms]">
            <span className="hero-legend">
              <Star className="hero-twinkle -left-2 -top-3 size-6 fill-current text-sky sm:-left-5 sm:-top-4 sm:size-8" aria-hidden />
              {SITE.name}
            </span>
            <br />
            <span className="relative inline-block text-[0.62em] tracking-[-0.035em]">
              <span className="hero-shimmer">{SITE.subject}</span>
              <svg className="hero-swash" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="hero-swash-g" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#7dd3fc" /><stop offset="0.55" stopColor="#34d399" /><stop offset="1" stopColor="#f6c453" />
                  </linearGradient>
                </defs>
                <path d="M4 18 L70 10 L110 14 L170 3 L220 12 L270 6 L330 14 L396 4" fill="none" stroke="url(#hero-swash-g)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Sparkles className="hero-twinkle -right-8 -top-2 size-8 text-gold [animation-delay:-1.2s] sm:-right-10 sm:size-10" aria-hidden />
            </span>
          </h1>

          <p className="mt-8 animate-rise font-display text-2xl font-bold tracking-tight sm:text-3xl [animation-delay:160ms]">
            Master{" "}
            <span className="hero-rotator" aria-label="your choices, the market, your money, the world">
              <span style={{ color: "#84cc16" }}>your choices.</span>
              <span style={{ color: "#f6c453" }}>the market.</span>
              <span style={{ color: "#38bdf8" }}>your money.</span>
              <span style={{ color: "#a78bfa" }}>the world.</span>
            </span>
          </p>

          <ul className="mt-6 flex flex-wrap gap-2.5">
            {heroChips.map((c, i) => (
              <li key={c.label} className="hero-chip animate-rise" style={{ "--accent": c.color, animationDelay: `${220 + i * 70}ms` } as CSSProperties}>
                <c.icon className="size-4" aria-hidden /><b>{c.n}</b> {c.label}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-muted [animation-delay:520ms]">
            Every choice costs something. Read the chapters, pass the quizzes, clear the units, and climb from Greenhorn at the trailhead all the way to{" "}
            <span className="hero-master"><Mountain className="size-[1.05em]" aria-hidden /> Summiteer</span>.
          </p>

          <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:600ms]">
            <Btn href="/chapters/1/"><BookOpen className="size-5" /> Start the climb</Btn>
            <Btn href="/quest/" variant="ghost"><Compass className="size-5" /> My Climb</Btn>
          </div>
          <div className="mt-4 animate-rise [animation-delay:640ms]"><InstallButton className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-muted transition hover:text-fg" /></div>
        </div>
        <div className="relative hidden animate-rise [animation-delay:200ms] lg:block">
          <TrailProfile />
        </div>
      </section>

      {/* PLAYER CARD */}
      <section className="mx-auto max-w-7xl px-6"><PlayerCard /></section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="glass grid grid-cols-2 overflow-hidden rounded-3xl md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`p-7 text-center ${i > 0 ? "md:border-l" : ""} ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t md:border-t-0" : ""} border-line`}>
              <div className="font-display text-5xl font-extrabold tracking-tight" style={{ color: s.color }}>{s.n}</div>
              <div className="mt-1 text-sm font-medium uppercase tracking-wider text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRAIL MAP (phones get the elevation profile here, since the hero hides it) */}
      <section className="mx-auto max-w-7xl px-6 pt-28">
        <SectionHeading eyebrow="The trail map" title={<>Start at the trailhead, <span className="text-gradient">finish on top</span></>}
          sub="Eight units, each a stretch of trail. Clear every task in a unit to earn its badge and climb one rank." />
        <div className="mb-8 lg:hidden"><TrailProfile /></div>
        <WorldMap />
      </section>

      {/* QUICK LINKS */}
      <section className="mx-auto max-w-7xl px-6 pt-24">
        <SectionHeading eyebrow="Your pack" title="Everything in one tap" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickLinks.map((q) => (
            <Link key={q.label} href={q.href} style={{ "--accent": q.color } as CSSProperties} className="accent-card group flex min-w-0 flex-col items-start gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:size-14" style={{ background: `color-mix(in srgb, ${q.color} 16%, transparent)`, color: q.color }}>
                <q.icon className="size-6 sm:size-7" />
              </span>
              <span className="w-full min-w-0">
                <span className="block font-bold leading-tight">{q.label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{q.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CHAPTERS */}
      <section className="mx-auto max-w-7xl px-6 pt-28">
        <SectionHeading eyebrow="All chapters" title="Jump to any chapter" sub="Every chapter has the reading, a 20-question quiz, a Think Like an Economist challenge, and key words, tagged to the Idaho standards it covers.">
          <Btn href="/chapters/" variant="ghost">Browse chapters <ArrowRight className="size-4" /></Btn>
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {chapters.slice(0, 8).map((ch) => <ChapterCard key={ch.id} ch={ch} />)}
        </div>
        <div className="mt-6 text-center">
          <Link href="/chapters/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-fg">See all {chapters.length} chapters <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      {/* BANNERS */}
      <section className="mx-auto grid max-w-7xl gap-4 px-6 pt-28 md:grid-cols-2">
        <Link href="/side-quests/" className="group relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-emerald/20 via-sky/10 to-transparent p-8 transition hover:border-emerald/50">
          <Tent className="absolute -right-6 -top-6 size-40 text-emerald/10 transition-transform duration-500 group-hover:rotate-12" />
          <Eyebrow color="#34d399">Off the trail</Eyebrow>
          <h3 className="font-display text-3xl font-extrabold">Side Quests</h3>
          <p className="mt-2 max-w-sm text-muted">15 real-world missions, from Price Detective to Interview an Entrepreneur to Idaho Export Story. 50 XP each.</p>
          <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-emerald">Explore <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <Link href="/pick-a-side/" className="group relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-sky/25 via-violet/10 to-transparent p-8 transition hover:border-sky/50">
          <Swords className="absolute -right-6 -top-6 size-40 text-sky/10 transition-transform duration-500 group-hover:-rotate-12" />
          <Eyebrow color="#38bdf8">Class favorite</Eyebrow>
          <h3 className="font-display text-3xl font-extrabold">Pick a Side</h3>
          <p className="mt-2 max-w-sm text-muted">Two debates per chapter. Choose a side, back it with economic reasoning, see where the class lands.</p>
          <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-sky">Debate <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </section>
    </>
  );
}
