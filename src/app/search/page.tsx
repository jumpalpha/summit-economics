import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { chapters, realmChapterLabel, realms } from "@/data/site";
import glossary from "@/data/content/glossary.json";
import { vocabModes } from "@/data/learn";
import { SITE } from "@/data/config";
import { SiteSearch, type Hit } from "./site-search";

export const metadata: Metadata = { title: "Search", description: `Search every chapter, key word, unit and page on ${SITE.fullName}.` };

const pages: Hit[] = [
  { type: "Page", icon: "🗺️", title: "Trail Map", desc: "Start here: the units, your player card and the climb.", url: "/" },
  { type: "Page", icon: "📖", title: "All Chapters", desc: "Every chapter, grouped by unit.", url: "/chapters/" },
  { type: "Page", icon: "📋", title: "My Climb", desc: "Log in to see your XP, trail rank, badges and checklist.", url: "/quest/" },
  { type: "Page", icon: "🏔️", title: "Unit Tests", desc: "One test per unit. Pass to clear the unit.", url: "/tests/" },
  { type: "Page", icon: "🗳️", title: "Pick a Side", desc: "Economics debates: pick a side and bring your reasons.", url: "/pick-a-side/" },
  { type: "Page", icon: "📊", title: "Survey of the Day", desc: "Vote, then see how the class answered.", url: "/survey/" },
  { type: "Page", icon: "⛺", title: "Side Quests", desc: "Real-world economics outside class for bonus XP.", url: "/side-quests/" },
  { type: "Page", icon: "📚", title: "Glossary", desc: "Every key word with its definition.", url: "/glossary/" },
  { type: "Page", icon: "🔤", title: "Vocab Games", desc: "Flashcard Flip, Speed Quiz and Word Builder for every chapter.", url: "/vocab/" },
  { type: "Page", icon: "🃏", title: "Review Deck", desc: "Practice the Quick Check questions you missed in the chapters.", url: "/review/" },
  { type: "Page", icon: "🎓", title: "Mastery Checks", desc: "A 10-question warm-up for each chapter before the graded quiz.", url: "/mastery/" },
  { type: "Page", icon: "🙋", title: `Ask ${SITE.teacher}`, desc: "Ask an economics question anonymously.", url: "/ask/" },
  { type: "Page", icon: "🧑‍🏫", title: "Teacher Dashboard", desc: "Class roster, progress and side quest approvals.", url: "/teacher/" },
];

function buildIndex(): Hit[] {
  const out: Hit[] = [];
  for (const r of realms) out.push({ type: "Realm", icon: r.icon, title: `Unit ${r.n}: ${r.name}`, desc: `${r.tagline} Chapters ${realmChapterLabel(r)}.`, url: `/realms/${r.n}/` });
  for (const c of chapters) {
    out.push({ type: "Chapter", icon: "📘", title: `Chapter ${c.label}: ${c.title}`, desc: c.sections.map((s) => s.heading).join(" · "), url: `/chapters/${c.id}/`, keys: [...c.keyWords, ...(c.standards ?? [])].join(" ") });
    out.push({ type: "Page", icon: "🔤", title: `Chapter ${c.label} vocab games`, desc: vocabModes.map((m) => m.title).join(", ") + ` for ${c.title}.`, url: `/vocab/?ch=${c.id}` });
  }
  for (const g of glossary as { term: string; definition: string; chapter: number | string }[])
    out.push({ type: "Word", icon: "🔑", title: g.term, desc: `${g.definition} (Chapter ${String(g.chapter).toUpperCase()})`, url: `/glossary/?q=${encodeURIComponent(g.term)}` });
  return [...out, ...pages];
}

export default function SearchPage() {
  const index = buildIndex();
  return (
    <>
      <PageHead eyebrow="Search everything" title="Find anything, fast"
        sub={`Search all ${chapters.length} chapters, ${realms.length} units and ${glossary.length} key words in one place. Try a word like "inflation" or a standard like 9-12.EC.15.`} />
      <SiteSearch index={index} />
    </>
  );
}
