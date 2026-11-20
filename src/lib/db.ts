"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// The publishable key is public by design:
// every table is locked, and the site can only call the functions in supabase/schema.sql.
// Summit's econ_ tables live in the dopp-health-class project (next to Dopps Class and Bedrock), with their own logins.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gmeyamrlqfrabtslsweu.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_zClDCZZQEfC9DILpesPiHg_IcyRqW-c";
export const dbReady = Boolean(SUPABASE_URL && SUPABASE_ANON);

let client: SupabaseClient | null = null;
export function db() {
  if (!dbReady) throw new Error("The class database isn't connected yet.");
  return (client ??= createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } }));
}

/** SHA-256 of the PIN plus a per-site salt, made in the browser (same scheme as Dopps Class). */
export async function hashSecret(secret: string, salt = "summit") {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret + "|" + salt + "|" + SUPABASE_URL));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type Student = { id: string; name: string; period: string; pinHash: string };
const KEY = "summit_student";

export function getStudent(): Student | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function setStudent(s: Student | null) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event("summit-student"));
}

export function useStudent() {
  const [s, setS] = useState<Student | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => { setS(getStudent()); setReady(true); };
    load();
    window.addEventListener("summit-student", load);
    return () => window.removeEventListener("summit-student", load);
  }, []);
  return { student: s, ready };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function signIn(mode: "login" | "register", name: string, period: string, pin: string) {
  const pinHash = await hashSecret(pin);
  const r = await rpc<{ id: string; name: string; period: string }>(mode === "login" ? "econ_login" : "econ_register",
    { p_name: name, p_period: period, p_pin_hash: pinHash });
  setStudent({ ...r, pinHash });
  return r;
}
export const signOut = () => setStudent(null);

function me() {
  const s = getStudent();
  if (!s) throw new Error("Log in first (top right).");
  return { p_id: s.id, p_pin_hash: s.pinHash };
}

export type ServerState = {
  tasks: string[]; days: string[]; best: Record<string, number>; firstTry: Record<string, number>; unitTries: Record<string, number>;
  sideQuests: { id: string; term: string; approved: boolean }[]; votes: number; term: string; unitAttempts: number;
  /** Realms recorded as cleared on the server (b_cleared). Missing until supabase/migrations/002 is applied. */
  cleared?: number[];
};
export const loadState = () => rpc<ServerState>("econ_state", me());
export const completeTask = (key: string) => rpc<void>("econ_complete_task", { ...me(), p_task_key: key });
// ── wave-sync: earned stays earned ──
/** Records a realm clear on the server. The server checks the unit test task plus every key sent (the realm's current task list).
 *  Returns the student's recorded clears. */
export const claimRealm = (realm: number, taskKeys: string[]) =>
  rpc<number[]>("econ_claim_realm", { ...me(), p_realm: realm, p_task_keys: taskKeys });
export type Graded = { score: number; total: number; pct: number; passed: boolean; results: Record<string, boolean> };
export const grade = (kind: "chapter" | "unit", ref: number, answers: Record<string, string>) =>
  rpc<Graded>("econ_grade", { ...me(), p_kind: kind, p_ref: ref, p_answers: answers });
export const vote = (kind: "survey" | "debate", item: string, choice: string, reason?: string) =>
  rpc<Record<string, number>>("econ_vote", { ...me(), p_kind: kind, p_item: item, p_choice: choice, p_reason: reason ?? null });
export const results = (kind: "survey" | "debate", item: string) => rpc<Record<string, number>>("econ_results", { p_kind: kind, p_item: item });
export const submitSideQuest = (quest: string, note: string) => rpc<void>("econ_side_quest_submit", { ...me(), p_quest: quest, p_note: note });

// Teacher: Summit's own teacher passcode, sent over HTTPS and checked in the database (only its SHA-256 is stored)
export const teacherHash = async (pass: string) => pass;
export const teacherCheck = (h: string) => rpc<boolean>("econ_teacher_check", { p_pass_hash: h });
export const teacherKeys = (h: string) => rpc<Record<string, string>>("econ_teacher_keys", { p_pass_hash: h });
export const teacherRoster = (h: string) => rpc<RosterRow[]>("econ_teacher_roster", { p_pass_hash: h });
export const teacherApprove = (h: string, student: string, quest: string, ok: boolean) =>
  rpc<void>("econ_teacher_approve", { p_pass_hash: h, p_student: student, p_quest: quest, p_ok: ok });
export const teacherResetPin = async (h: string, student: string, pin: string) =>
  rpc<void>("econ_teacher_reset_pin", { p_pass_hash: h, p_student: student, p_pin_hash: await hashSecret(pin) });
export type RosterRow = {
  id: string; name: string; period: string; tasks: string[]; days: number; best: Record<string, number>; cleared?: number[];
  sideQuests: { id: string; term: string; note: string; approved: boolean }[];
};

/** Fisher–Yates. Every quiz and test shuffles its choices on every attempt. */
export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

