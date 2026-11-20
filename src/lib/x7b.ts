"use client";
// Database calls for the Daily Briefing, Suggest an Improvement and the visit counter (supabase/schema.sql).
// Same pattern as lib/db.ts: the page only calls security-definer functions.
import { db, dbReady, getStudent } from "@/lib/db";

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
export const x7bReady = dbReady;
/** True when the error means schema.sql hasn't been run yet. */
export const notInstalled = (e: unknown) => /function|schema cache|does not exist/i.test(String((e as Error)?.message ?? e));
export const needsUpdate = "Needs the database setup (supabase/schema.sql).";

// ---------- Daily Briefing ----------
export type Briefing = { announcement: string; updated_at: string };
export const briefingGet = () => rpc<Briefing>("econ_briefing_get", {});
export const teacherBriefingSet = (h: string, text: string) => rpc<Briefing>("econ_teacher_briefing_set", { p_pass_hash: h, p_announcement: text });

// ---------- Suggest an Improvement ----------
export const SUGGEST_CATS = [
  ["bug", "Bug or broken link"],
  ["game", "New activity idea"],
  ["content", "Chapter or content suggestion"],
  ["design", "Design or usability"],
  ["other", "Something else"],
] as const;
export type SuggestCat = (typeof SUGGEST_CATS)[number][0];
export const suggest = (name: string, category: SuggestCat, message: string, page: string) => {
  const s = getStudent();
  return rpc<{ ok: boolean }>("econ_suggest", { p_id: s?.id ?? null, p_pin_hash: s?.pinHash ?? null, p_name: name, p_category: category, p_message: message, p_page: page });
};
export type SuggestionRow = { id: number; name: string | null; student: string | null; period: string | null; category: SuggestCat; message: string; page: string | null; status: "new" | "done" | "archived"; created_at: string };
export const teacherSuggestions = (h: string, archived: boolean) => rpc<SuggestionRow[]>("econ_teacher_suggestions", { p_pass_hash: h, p_archived: archived });
export const teacherSuggestionSet = (h: string, id: number, status: SuggestionRow["status"]) => rpc<void>("econ_teacher_suggestion_set", { p_pass_hash: h, p_suggestion: id, p_status: status });

// ---------- Site visit counter ----------
export type Visits = { total: number; since: string };
/** Counts one visit per browser tab session (sessionStorage), then returns the all-time total. */
export async function siteVisits(): Promise<Visits | null> {
  if (!dbReady) return null;
  let counted = false;
  try { counted = sessionStorage.getItem("summit_visit") === "1"; } catch {}
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) counted = true; // local builds never add visits
  try {
    const v = await rpc<Visits>(counted ? "econ_site_visit_count" : "econ_site_visit_hit", {});
    try { sessionStorage.setItem("summit_visit", "1"); } catch {}
    return v;
  } catch { return null; }
}
// ── end wave-x7b ──
