"use client";
// Ask the Teacher: anonymous student questions (saved with no name, only the day). See supabase/schema.sql.
import { db, getStudent } from "@/lib/db";

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
function me() {
  const s = getStudent();
  if (!s) throw new Error("Log in first (top right).");
  return { p_id: s.id, p_pin_hash: s.pinHash };
}
export type AskPosted = { topic: string; body: string; answer: string; answered_on: string | null };
export type AskStatus = "new" | "posted" | "in_class" | "skipped";
export type AskRow = { id: string; day: string; topic: string; body: string; answer: string | null; status: AskStatus; answered_on: string | null };
export const askSubmit = (topic: string, body: string) => rpc<{ ok: boolean; left_today: number }>("econ_ask_submit", { ...me(), p_topic: topic, p_body: body });
export const askBoard = () => rpc<AskPosted[]>("econ_ask_board", me());
export const askTeacherList = (h: string) => rpc<AskRow[]>("econ_ask_teacher_list", { p_pass_hash: h });
export const askTeacherSet = (h: string, id: string, answer: string, status: AskStatus, body: string | null) =>
  rpc<AskRow[]>("econ_ask_teacher_set", { p_pass_hash: h, p_question: id, p_answer: answer, p_status: status, p_body: body });
export const askTeacherDelete = (h: string, id: string) => rpc<AskRow[]>("econ_ask_teacher_hide", { p_pass_hash: h, p_question: id });
