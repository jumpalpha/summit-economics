// Runs first in `npm run build`. The repo is public, so it must never hold answer keys.
// Fails the build if questions.json carries answers, or if a private key/source file slipped into the repo.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const bad = [];
const q = JSON.parse(readFileSync("src/data/content/questions.json", "utf8"));
for (const kind of ["chapter", "unit"])
  for (const [ref, list] of Object.entries(q[kind] ?? {}))
    for (const x of list) {
      const extra = Object.keys(x).filter((k) => !["id", "q", "choices"].includes(k));
      if (extra.length) bad.push(`questions.json ${kind} ${ref} ${x.id}: unexpected field(s) ${extra.join(", ")}`);
      if (!Array.isArray(x.choices) || x.choices.length !== 4) bad.push(`questions.json ${x.id}: needs 4 choices`);
    }
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = path.join(d, f);
  if (["node_modules", ".next", "out", ".git"].includes(f)) return [];
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const f of walk("."))
  if (/(^|\/)(keys[^/]*\.(sql|json)|[^/]*PRIVATE[^/]*)$/.test(f) || (/\.txt$/.test(f) && /^=QUIZ/m.test(readFileSync(f, "utf8"))))
    bad.push(`private file in the repo: ${f}`);
if (existsSync("src/data/content/questions.json") && /"answer"\s*:/.test(readFileSync("src/data/content/questions.json", "utf8")))
  bad.push("questions.json contains an \"answer\" field");
if (bad.length) { console.error("check-keys: STOP\n- " + bad.join("\n- ")); process.exit(1); }
console.log("check-keys: OK (no answer keys in the repo)");
