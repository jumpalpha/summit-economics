"use client";

import { useCallback, useEffect, useState } from "react";
import { claimRealm, completeTask, dbReady, loadState, useStudent, type ServerState } from "@/lib/db";
import { computeStats, requiredTasks } from "@/data/site";

/** Realm claims already sent from this page (shared by every component using the hook). */
const claimedOnce = new Set<string>();

/** The logged-in student's progress from the database, plus the derived XP, rank and badges. */
export function useProgress() {
  const { student, ready } = useStudent();
  const [state, setState] = useState<ServerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!student || !dbReady) { setState(null); return; }
    setLoading(true);
    try { setState(await loadState()); setError(null); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [student]);

  useEffect(() => { refresh(); }, [refresh]);

  const check = async (key: string) => { await completeTask(key); await refresh(); };
  const stats = computeStats(state ?? { tasks: [], days: [] });

  // ── wave-sync: earned stays earned ──
  // The moment a realm is computed as cleared, record it on the server, so the badge and rank survive
  // new chapters or tasks being added to that realm later. Best effort: a failure never blocks the page.
  const toClaim = state ? stats.clearedNow.filter((r) => !(state.cleared ?? []).includes(r.n)) : [];
  const claimKey = student && toClaim.length ? `${student.id}:${toClaim.map((r) => r.n).join(",")}` : "";
  useEffect(() => {
    if (!claimKey || claimedOnce.has(claimKey)) return;
    claimedOnce.add(claimKey);
    (async () => {
      let rec: number[] | null = null;
      for (const r of toClaim) {
        try { rec = await claimRealm(r.n, requiredTasks(r).map((t) => t.key)); } catch { /* not deployed yet or not eligible: computed clears still show */ }
      }
      if (rec) setState((s) => (s ? { ...s, cleared: rec! } : s));
    })();
  }, [claimKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { student, ready, state, stats, error, loading, refresh, check, signedIn: !!student && !!state };
}
