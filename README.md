# Summit Economics

Mrs. Bohrer's high school economics class (juniors & seniors), live at **https://economics.doppsclass.com**.
A mountain-climb version of [Dopps Class](https://doppsclass.com) and [Bedrock](https://bedrock.doppsclass.com), built from the
same Next.js source: same layout, nav, XP rules, light/dark modes and logins, reskinned with mountains, trails and hiking.
No games (yet).

- 24 chapters in 8 units (Trailhead → Market Meadow → Timber Camp → River Crossing → Switchbacks → The Ridge → Ranger Station → The Summit)
- Covers all 24 Idaho high school economics standards (9-12.EC.1–24); each chapter shows the standards it teaches
- 441-word glossary, 20-question chapter quizzes, 30-question unit tests, Think Like an Economist challenges (with teacher model answers),
  240 practice/Quick Check questions, vocab games, Pick a Side debates, Survey of the Day, 15 side quests, Ask the Teacher, teacher dashboard
- Trail ranks: Greenhorn at the trailhead, one rank per unit cleared, Summiteer for all eight

## Change the teacher's name
Edit `src/data/config.ts` (`teacher`, `teacherPossessive`, and optionally `TEACHER_CONTACT`), push to `main`. That's it.

## XP
25 XP per task, 5 XP per day logged in, 50 XP per approved side quest. Each chapter has 3 tasks
(read, quiz at 80%+, Think Like an Economist) and each unit a unit test (70%+, 2 tries).

## Answer keys stay private
This repo is public, so it holds **no answer keys**. Keys live only in the Supabase table `econ_keys`
(Summit's `econ_` tables share the dopp-health-class project with Dopps Class and Bedrock; logins and data stay separate).
Quizzes are graded by the database function `econ_grade`, which returns right/wrong per question, never the answer.
`npm run build` runs `scripts/check-keys.mjs` first and fails if anything key-like lands in the repo.

The **teacher dashboard** (`/teacher/`) uses Summit's own passcode (not the Dopps Class code). Only its SHA-256 is stored.
To change it, see the comment at the top of `supabase/schema.sql`.

## Editing content
The master curriculum (chapters, quizzes **with answers**, model answers) is kept privately outside this repo
(`summit-content/`: one text file per chapter + `build.py`). Edit there, run `python3 build.py`, commit the
`src/data/content/*.json` it writes, and load its private `keys.sql` into Supabase. Never commit `keys.sql`.

## Build & deploy
- `npm run dev` to preview, `npm run build` to build the static site into `out/`.
- Pushing to `main` deploys through `.github/workflows/pages.yml` (GitHub Pages, custom domain from `public/CNAME`).
