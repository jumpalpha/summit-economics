"use client";

import { useState } from "react";
import data from "@/data/content/side_quests.json";
import { realms, SIDE_QUESTS_PER_TERM, XP_PER_SIDE_QUEST } from "@/data/site";
import { dbReady, submitSideQuest } from "@/lib/db";
import { useProgress } from "@/lib/progress";
import { Eyebrow, Md, PageHead } from "@/components/ui";

type SQ = { n: number; title: string; realm: string; task: string; proof: string };

export default function SideQuests() {
  const { signedIn, state, stats, refresh } = useProgress();
  const mine = new Map((state?.sideQuests ?? []).map((q) => [q.id, q]));
  return (
    <>
      <PageHead eyebrow="Side quests" title="Real-world economics."
        sub={`Complete ${SIDE_QUESTS_PER_TERM} per term. Each approved side quest is worth ${XP_PER_SIDE_QUEST} XP and the first one earns the Trail Volunteer badge.`}>
        {signedIn && <p className="mt-4 font-extrabold">This term: {stats.termApproved} of {SIDE_QUESTS_PER_TERM} approved.</p>}
      </PageHead>
      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="block-panel mb-8 p-4 !border-amber"><Md text={data.safetyNotes} /></div>
        <div className="grid gap-5 md:grid-cols-2">
          {(data.quests as SQ[]).map((q) => {
            const color = realms.find((r) => r.name === q.realm)?.color ?? "var(--color-grass)";
            const s = mine.get(`sq${q.n}`);
            return (
              <div key={q.n} className="accent-card flex flex-col p-5 pt-6" style={{ "--accent": color } as React.CSSProperties}>
                <Eyebrow color={color}>#{q.n} · {q.realm}</Eyebrow>
                <h2 className="pixel-title text-2xl">{q.title}</h2>
                <p className="mt-2 font-semibold">{q.task}</p>
                <p className="mt-2 text-sm text-muted"><b>Proof:</b> {q.proof}</p>
                <div className="mt-auto pt-4">
                  {s ? <span className={`inline-block rounded-lg border border-line px-2 py-1 text-sm font-extrabold ${s.approved ? "bg-emerald text-black" : "bg-gold text-black"}`}>{s.approved ? `Approved · +${XP_PER_SIDE_QUEST} XP` : "Turned in, waiting for Mr. Dopp"}</span>
                    : <Submit id={`sq${q.n}`} disabled={!dbReady || !signedIn} onDone={refresh} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Submit({ id, disabled, onDone }: { id: string; disabled: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  if (disabled) return <span className="text-sm font-bold text-muted">{dbReady ? "Log in to turn this in." : "Preview: turning in opens once the class database is connected."}</span>;
  if (!open) return <button onClick={() => setOpen(true)} className="btn-block btn-grass !text-sm">I finished this</button>;
  return (
    <div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Where did you share your write-up or slideshow? (Classroom post, link, or 'handed in on paper')" className="w-full rounded-xl border border-line bg-ink p-2 text-sm font-semibold" />
      {err && <p className="text-sm font-bold text-crimson">{err}</p>}
      <button onClick={async () => { try { await submitSideQuest(id, note); onDone(); } catch (e) { setErr((e as Error).message); } }} disabled={note.trim().length < 3} className="btn-block btn-grass mt-2 !text-sm disabled:opacity-50">Turn it in</button>
    </div>
  );
}
