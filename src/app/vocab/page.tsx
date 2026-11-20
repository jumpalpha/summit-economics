import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { VocabEngine } from "@/components/vocab-engine";

// ── wave-learnA: Vocab Engine ──
export const metadata: Metadata = { title: "Vocab Games", description: "Flashcard Flip, Speed Quiz, Word Builder and Concept Map for every chapter's key words." };

export default function VocabPage() {
  return (
    <>
      <PageHead eyebrow="Vocab Engine" title="Vocab games" sub="Four ways to lock in every chapter's key words. Pick a chapter and a game." />
      <VocabEngine />
    </>
  );
}
