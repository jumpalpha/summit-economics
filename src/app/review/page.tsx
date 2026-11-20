import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { ReviewDeck } from "./review-deck";

// ── wave-learnA: Review Deck ──
export const metadata: Metadata = { title: "Review Deck", description: "Practice the Quick Check questions you missed in the chapters." };

export default function ReviewPage() {
  return (
    <>
      <PageHead eyebrow="Review Deck" title="🃏 Review Deck"
        sub={<>Every Quick Check you miss in a chapter lands here. Get a question right <b className="text-fg">2 times in a row</b> and it leaves your deck.</>} />
      <ReviewDeck />
    </>
  );
}
