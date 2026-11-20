"use client";

import { useEffect, useState } from "react";
import survey from "@/data/content/survey.json";
import { daysOfYear } from "@/data/site";
import { Eyebrow, PageHead } from "@/components/ui";
import { VoteBox } from "@/components/vote-box";

type S = { n: number; question: string; options: string[] | null; openEnded?: boolean };
const qs = survey.questions as S[];

export default function Survey() {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => setI(daysOfYear() % qs.length), []);
  const q = i == null ? null : qs[i];
  return (
    <>
      <PageHead eyebrow="Survey of the Day" title="Quick poll" sub="No right answer. A new question every day, and you see how the class voted." />
      <div className="mx-auto max-w-2xl px-6 pt-10">
        {q && (
          <div className="block-panel p-6">
            <Eyebrow>Question {q.n} of {qs.length}</Eyebrow>
            <h2 className="pixel-title mb-5 text-2xl leading-snug sm:text-3xl">{q.question}</h2>
            <VoteBox key={q.n} kind="survey" item={`s${q.n}`} options={q.options ?? []} openEnded={!q.options} />
          </div>
        )}
      </div>
    </>
  );
}
