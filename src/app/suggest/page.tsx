// Suggest an Improvement.
import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { SuggestForm } from "./suggest";
import { SITE } from "@/data/config";

export const metadata: Metadata = { title: "Suggest an Improvement", description: `Found a bug or have an idea for ${SITE.name}? Tell ${SITE.teacher}.` };

export default function SuggestPage() {
  return (
    <>
      <PageHead eyebrow="Feedback" title="Suggest an improvement"
        sub={`Found a bug? Have an idea for a new activity, chapter or feature? Tell ${SITE.teacher}. It goes straight to the teacher dashboard.`} />
      <div className="mx-auto max-w-2xl px-6 pt-6"><SuggestForm /></div>
    </>
  );
}
