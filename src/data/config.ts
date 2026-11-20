// ── Site settings: change these in ONE place ──
// The teacher's name shows on every page (header, Ask box, quizzes, parents page…).
// To hand the class to someone else, edit `teacher` (and `teacherFormal` if needed), push to main, done.
export const SITE = {
  /** How students address the teacher. */
  teacher: "Mrs. Bohrer",
  /** Used in "Mrs. Bohrer's class". */
  teacherPossessive: "Mrs. Bohrer's",
  name: "Summit",
  subject: "Economics",
  fullName: "Summit Economics",
  domain: "economics.doppsclass.com",
  school: "Thunder Ridge High School",
  grades: "Juniors & Seniors",
  hashtag: "#ClimbOn",
} as const;

/** How parents should reach the teacher (shown on /parents/). Leave null to show a "coming soon" note.
 *  Example: [{ label: "Email", value: "name@school.org", href: "mailto:name@school.org" }] */
export const TEACHER_CONTACT: { label: string; value: string; href?: string }[] | null = null;
