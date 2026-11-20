"use client";

import { useState } from "react";
import { LogIn, LogOut, X } from "lucide-react";
import { dbReady, signIn, signOut, useStudent } from "@/lib/db";
import { SITE } from "@/data/config";

export const PERIODS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

export function LoginChip() {
  const { student, ready } = useStudent();
  const [open, setOpen] = useState(false);
  if (!ready) return <span className="h-10 w-24" />;
  if (student)
    return (
      <button onClick={() => { if (confirm(`Log out ${student.name}?`)) signOut(); }} title="Log out"
        className="hidden items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted transition hover:text-fg sm:flex">
        <span className="size-2 rounded-full bg-emerald shadow-[0_0_10px_#34d399]" />
        {student.name} <LogOut className="size-4 text-muted" />
      </button>
    );
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted transition hover:text-fg"><LogIn className="size-4" /> Log in</button>
      {open && <LoginDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [period, setPeriod] = useState(PERIODS[0]);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return setMsg("Your PIN is 4 numbers.");
    setBusy(true); setMsg(null);
    try { await signIn(mode, name, period, pin); onClose(); } catch (err) { setMsg((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={go} onClick={(e) => e.stopPropagation()} className="block-panel w-full max-w-sm bg-ink-2 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{mode === "login" ? "Log in" : "New player"}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <p className="mt-1 text-sm text-muted">{SITE.name} has its own login, separate from other class sites.</p>
        {!dbReady && <p className="mt-3 rounded-xl border border-amber/40 bg-amber/10 p-2 text-sm font-bold">Preview only: the class database isn&apos;t connected yet.</p>}
        <label className="mt-4 block text-sm font-extrabold">Name (first name + last initial)
          <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 font-semibold" />
        </label>
        <label className="mt-3 block text-sm font-extrabold">Class period
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 font-semibold">
            {PERIODS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="mt-3 block text-sm font-extrabold">4-digit PIN
          <input required inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} type="password" className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 font-semibold tracking-[0.5em]" />
        </label>
        {msg && <p className="mt-3 text-sm font-bold text-crimson">{msg}</p>}
        <button disabled={busy || !dbReady} className="btn-block btn-grass mt-5 w-full justify-center disabled:opacity-50">{busy ? "…" : mode === "login" ? "Log in" : "Create my player"}</button>
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-3 w-full text-center text-sm font-bold text-muted underline">
          {mode === "login" ? "First time? Make a new player" : "Already have a player? Log in"}
        </button>
      </form>
    </div>
  );
}
