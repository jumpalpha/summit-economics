"use client";
// ── wave-x7b ── all-time site visit counter (twin of Dopps Class site_visits.sql + the pwa.js counter).
// One visit per browser tab session; shows nothing until 010_x7b.sql is applied.
import { useEffect, useState } from "react";
import { siteVisits, type Visits } from "@/lib/x7b";

export function VisitCount() {
  const [v, setV] = useState<Visits | null>(null);
  useEffect(() => { siteVisits().then(setV); }, []);
  if (!v || typeof v.total !== "number") return null;
  return <span data-testid="visit-count"> · {v.total.toLocaleString()} visits since {new Date(v.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>;
}
