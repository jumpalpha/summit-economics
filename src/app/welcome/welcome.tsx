"use client";
// ── wave-x7b ── Welcome back screen: twin of Dopps Class welcome.html.
// Check-in for today's streak day (+5 XP, logged by b_state when the page loads), switch student,
// continue where you left off, the Review Deck, Today's briefing (teacher announcement + Survey of the Day),
// and the student's next tasks.
import Link from "next/link";
import { useEffect, useState } from "react";
import survey from "@/data/content/survey.json";
import { chapters, daysOfYear, realmForChapter, XP_PER_DAY } from "@/data/site";
import { dbReady, signOut } from "@/lib/db";
import { useProgress } from "@/lib/progress";
import { useLearn } from "@/lib/learn-progress";
import { briefingGet, notInstalled, type Briefing } from "@/lib/x7b";
import { LoginDialog } from "@/components/login";
import { ArtIcon } from "@/components/art-icon";
import { VoteBox } from "@/components/vote-box";
import { nextTasks, requiredProgress, UpNextList } from "@/components/x7b/up-next";
import { SITE } from "@/data/config";

type S = { n: number; question: string; options: string[] | null };
const qs = survey.questions as S[];
const denverToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });

export function Welcome() {
  const { student, ready, state, stats, loading, refresh, error } = useProgress();
  const { s: learn } = useLearn();
  const [login, setLogin] = useState(false);
  const [brief, setBrief] = useState<Briefing | null | "none" | "error">(null);
  const [sq, setSq] = useState<S | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(denverToday());
    setSq(qs[daysOfYear() % qs.length]);
    if (!dbReady) { setBrief("none"); return; }
    briefingGet().then((b) => setBrief(b ?? "none")).catch((e) => setBrief(notInstalled(e) ? "none" : "error"));
  }, []);

  if (!ready) return <div className="mx-auto h-96 max-w-3xl" />;

  if (!student)
    return (
      <div className="mx-auto max-w-xl px-6 pt-36 text-center">
        <ArtIcon fallback="🏔️" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-4xl font-extrabold">Welcome, explorer!</h1>
        <p className="mt-3 text-muted">Log in once with your name, class period and PIN. After that this device remembers you, so you land right here each day.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-block btn-grass" onClick={() => setLogin(true)}>▲ Log in</button>
          <Link href="/" className="btn-block">🌍 Home page</Link>
        </div>
        {login && <LoginDialog onClose={() => setLogin(false)} />}
      </div>
    );

  const checkedIn = !!state && state.days.some((d) => String(d).slice(0, 10) === today);
  const p = requiredProgress(stats.done);
  const next = nextTasks(stats.done, 6);
  const reading = chapters.find((c) => !stats.done.has(`ch${c.id}_read`)) ?? null;
  const readN = reading ? Object.keys(learn.reads[reading.id] ?? {}).length : 0;
  const deck = Object.keys(learn.deck).length;
  const here = reading ? realmForChapter(reading.id) : realmForChapter(28);
  const ann = brief && typeof brief === "object" ? brief.announcement.trim() : "";

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-28 sm:px-6 sm:pt-32">
      <section className="glass rounded-3xl p-6 text-center" style={{ boxShadow: `0 20px 60px -30px ${here.color}` }}>
        <ArtIcon slug={`realm-${here.n}`} fallback={here.icon} size={96} className="mx-auto" />
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl" data-testid="welcome-name">Welcome back, {student.name}!</h1>
        <div className="mt-1 text-sm font-semibold text-muted">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}{state?.term ? ` · ${state.term}` : ""} · <span className="text-gold">▲ {stats.rank.name}</span>
        </div>
        <div className="mt-5">
          {checkedIn ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald bg-emerald/15 px-5 py-3 font-extrabold text-emerald" data-testid="checked-in">✓ Checked in for today <span className="rounded-full bg-emerald/20 px-2 text-xs">+{XP_PER_DAY} XP</span></div>
          ) : (
            <button className="btn-block btn-grass" disabled={loading || !dbReady} onClick={() => refresh()}>{loading ? "Checking in…" : `✅ Yes, I'm ${student.name}`}</button>
          )}
          <p className="mt-2 text-xs text-muted">{checkedIn ? "Today counts toward your login streak." : `Opening ${SITE.name} while logged in counts as today's login (+${XP_PER_DAY} XP).`}</p>
          {error && <p className="mt-1 text-sm font-bold text-crimson">{error}</p>}
        </div>
        <button className="mt-3 text-sm font-bold text-muted underline" onClick={() => { signOut(); setLogin(true); }}>Not {student.name}? Switch student</button>
        {login && <LoginDialog onClose={() => setLogin(false)} />}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {reading ? (
          <Link href={`/chapters/${reading.id}/`} className="accent-card flex items-center gap-3 rounded-2xl p-4" style={{ "--accent": here.color } as React.CSSProperties}>
            <span className="text-3xl">▶</span>
            <span><b className="block">{readN ? "Continue" : "Start reading"}: Chapter {reading.label}</b><span className="text-sm text-muted">{reading.title}{readN ? ` · ${readN} of ${reading.sections.length} sections read` : ""}</span></span>
          </Link>
        ) : (
          <Link href="/chapters/" className="accent-card flex items-center gap-3 rounded-2xl p-4"><span className="text-3xl">📚</span><span><b className="block">Every chapter read!</b><span className="text-sm text-muted">Revisit any chapter</span></span></Link>
        )}
        <Link href="/review/" className="accent-card flex items-center gap-3 rounded-2xl p-4" style={{ "--accent": "#f28c28" } as React.CSSProperties}>
          <span className="text-3xl">🃏</span>
          <span><b className="block">{deck ? `Review Deck: ${deck} question${deck === 1 ? "" : "s"} to practice` : "Review Deck"}</b><span className="text-sm text-muted">{deck ? `Quick Checks you missed · about ${Math.max(1, Math.round(deck / 2))} min` : "Quick Checks you miss land here"}</span></span>
        </Link>
      </div>

      <section className="block-panel p-5" data-testid="briefing">
        <h2 className="pixel-title mb-3 text-2xl">📣 Today&apos;s briefing</h2>
        {brief === null ? <div className="h-12 animate-pulse rounded-xl bg-white/5" />
          : brief === "error" ? <p className="text-sm text-muted">Couldn&apos;t load announcements. Check your internet and refresh.</p>
          : ann ? <div className="whitespace-pre-line rounded-xl border-l-4 border-gold bg-gold/10 p-4 font-semibold" data-testid="announcement">{ann}</div>
          : <p className="text-sm text-muted">No announcements today. Keep climbing! ▲</p>}
        {sq && (
          <div className="mt-5">
            <div className="mb-2 font-extrabold">🗳 Survey of the Day: {sq.question}</div>
            <VoteBox key={sq.n} kind="survey" item={`s${sq.n}`} options={sq.options ?? []} openEnded={!sq.options} />
            <p className="mt-2 text-xs text-muted">No right answer. You see the class totals after you vote. <Link href="/survey/" className="underline">Open the survey page</Link></p>
          </div>
        )}
      </section>

      <section className="block-panel p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="pixel-title text-2xl">📋 Your work</h2>
          <span className="text-sm font-bold text-muted">{p.done} of {p.total} required tasks · {p.pct}%</span>
        </div>
        <div className="xp-bar mb-4"><div className="xp-fill" style={{ width: `${p.pct}%` }} /></div>
        {next.length ? <UpNextList items={next} /> : <p className="font-bold text-emerald">Your whole checklist is done. Legendary! 💎</p>}
      </section>

      <Link href="/ask/" className="accent-card flex items-center gap-3 rounded-2xl p-4" style={{ "--accent": "#a78bfa" } as React.CSSProperties}>
        <span className="text-3xl">🙋</span><span><b className="block">Ask {SITE.teacher}</b><span className="text-sm text-muted">Got a question you don&apos;t want to ask out loud? Ask it anonymously.</span></span>
      </Link>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link href="/quest/" className="btn-block btn-grass">📋 My full checklist</Link>
        <Link href="/" className="btn-block">🌍 Home page</Link>
      </div>
    </div>
  );
}
