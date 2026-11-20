"use client";
// Sub Guide type-in boxes. The teacher can pre-fill them with a link: /sub-guide/#name=Ms.%20Lee&date=Nov%2020
// (the hash is read once, then removed from the address bar). Nothing is saved.
import { useEffect, useState } from "react";

export function SubFields() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get("name")) setName(p.get("name")!);
    if (p.get("date")) setDate(p.get("date")!);
    if (location.hash) history.replaceState(null, "", location.pathname);
  }, []);
  return (
    <div className="grid min-w-[240px] gap-1.5 text-sm">
      <label className="flex items-baseline gap-2"><b className="w-12 shrink-0">For:</b><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Substitute teacher" /></label>
      <label className="flex items-baseline gap-2"><b className="w-12 shrink-0">Date:</b><input value={date} onChange={(e) => setDate(e.target.value)} placeholder="" /></label>
    </div>
  );
}

export function PrintButton({ label = "Print this guide" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className="btn-block btn-grass !text-sm">🖨 {label}</button>;
}
