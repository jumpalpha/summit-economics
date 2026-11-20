import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { MasteryCheck } from "./mastery-check";

// ── wave-learnA: Mastery Checks (practice; see mastery-check.tsx for why it is not recorded) ──
export const metadata: Metadata = { title: "Mastery Checks", description: "A 10-question warm-up for every chapter before the graded quiz." };

export default function MasteryPage() {
  return (
    <>
      <PageHead eyebrow="Mastery Checks" title="🎓 Chapter Mastery" sub="Prove you know a chapter before the graded quiz: 10 questions, 8 right to pass." />
      <MasteryCheck />
    </>
  );
}
