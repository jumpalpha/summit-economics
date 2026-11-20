// Concept Map big ideas (the Concept Map mode of the Vocab Engine).
// Each chapter's vocabulary grouped into 3–5 big ideas: name, one-sentence idea, exact glossary terms.
// A chapter with no entry shows "coming soon" in Concept Map mode (the other vocab games still work).
export type BigIdea = { name: string; idea: string; terms: string[] };
export const conceptMap: Record<string, BigIdea[]> = {};
