# Curriculum seed scripts

Manifest of which program/exam has a seed script, so it's obvious what's already
seedable when building program/exam/syllabus landing pages, and what still needs a
script written. Every script is idempotent (safe to re-run) and lives under
`scripts/seed/`.

- Run one exam: `npm run seed:<key>` (see table) — reads DB creds from `.env.development`
- Run everything: `npm run seed:all`
- Running a script directly instead of via npm: `npx tsx --env-file=.env.development scripts/seed/exams/<exam>.ts`
  (`DATABASE_URL` isn't in the shell env by default — same latent requirement as the
  pre-existing `db:seed`/`db:migrate` scripts, just made explicit here via `--env-file`)
- Shared subjects (Physics, Chemistry, Mathematics, Biology, Engineering Mathematics,
  Digital Logic) live in `scripts/seed/data/shared-subjects.ts` and are reused across
  exams wherever their real syllabi overlap — see "Shared subjects" below before adding
  a new subject so you don't create a near-duplicate.

## Status

| Program | Exam | Script | npm script | Status |
|---|---|---|---|---|
| PG Engineering Exams | GATE-CSE | `scripts/seed/exams/gate-cse.ts` | `seed:gate-cse` | ✅ Seeded |
| PG Engineering Exams | GATE-ECE | `scripts/seed/exams/gate-ece.ts` | `seed:gate-ece` | ✅ Seeded |
| PG Engineering Exams | NIMCET | `scripts/seed/exams/nimcet.ts` | `seed:nimcet` | ⚠️ Curriculum seeded, but exam row lives under the pre-existing **MCA Entrance Exam** program (see note) |
| UG Engineering Exams | JEE Main | `scripts/seed/exams/jee-main.ts` | `seed:jee-main` | ✅ Seeded |
| UG Engineering Exams | JEE Advanced | `scripts/seed/exams/jee-advanced.ts` | `seed:jee-advanced` | ✅ Seeded |
| UG Engineering Exams | UPSEE | `scripts/seed/exams/upsee.ts` | `seed:upsee` | ⚠️ Curriculum seeded, but exam row lives under the pre-existing **MCA Entrance Exam** program (see note) |
| UG Medical Exams | NEET-UG | `scripts/seed/exams/neet-ug.ts` | `seed:neet-ug` | ✅ Seeded |
| UG Medical Exams | AIIMS-UG | `scripts/seed/exams/aiims-ug.ts` | `seed:aiims-ug` | ✅ Seeded |
| UG Medical Exams | JIPMER-UG | `scripts/seed/exams/jipmer-ug.ts` | `seed:jipmer-ug` | ✅ Seeded |
| UG CUET & Board Exams | CUET-UG | `scripts/seed/exams/cuet-ug.ts` | `seed:cuet-ug` | ✅ Seeded |
| UG CUET & Board Exams | CBSE Class 12 Board | `scripts/seed/exams/cbse-class-12.ts` | `seed:cbse-12` | ✅ Seeded |
| UG CUET & Board Exams | CBSE Class 10 Board | `scripts/seed/exams/cbse-class-10.ts` | `seed:cbse-10` | ✅ Seeded |
| *(no script)* | BHU-MCA | — | — | Pre-existing exam under **MCA Entrance Exam**, untouched |

> **NIMCET/UPSEE program note**: `MCA Entrance Exam` (with exams BHU-MCA, NIMCET, UPSEE)
> already existed in the DB before these scripts were written. `upsertExam()` matches by
> slug only and never moves an existing exam to a different program, so running
> `seed:nimcet`/`seed:upsee` attached their curriculum correctly but left both exams
> filed under `MCA Entrance Exam` rather than `PG Engineering Exams`/`UG Engineering
> Exams` — left as-is deliberately (2026-08-09). Reassign via the admin UI (exam edit →
> program select) if you want them refiled; nothing about the seeded curriculum depends
> on which program the exam sits under.

No exam has a script for question/article content yet beyond the illustrative rows in
`scripts/seed-curriculum-sample.ts` (JEE Advanced + NIMCET) — that's still a gap, see
"Known gaps" below.

## Shared subjects

Curriculum nodes are global (`curriculum_nodes` has no exam column) — a subject only
gets tied to an exam via `exam_node_map`. Wherever two exams genuinely test the same
syllabus, they point at the *same* subject tree instead of two copies:

| Subject | Shared by |
|---|---|
| Physics | JEE Main, JEE Advanced, UPSEE, NEET-UG, AIIMS-UG, JIPMER-UG, CUET-UG, CBSE Class 12 |
| Chemistry | JEE Main, JEE Advanced, UPSEE, NEET-UG, AIIMS-UG, JIPMER-UG, CUET-UG, CBSE Class 12 |
| Mathematics | JEE Main, JEE Advanced, UPSEE, CUET-UG, CBSE Class 12 |
| Biology | NEET-UG, AIIMS-UG, JIPMER-UG, CUET-UG, CBSE Class 12 |
| Engineering Mathematics | GATE-CSE, GATE-ECE |
| Digital Logic | GATE-CSE, GATE-ECE |

CBSE Class 10's subjects are deliberately **not** shared with the above (different
depth; would also collide by name) — see `scripts/seed/data/board-subjects.ts`.

## Content depth & accuracy

Subject → chapter → topic (→ subtopic for one Physics chapter, as a depth
demonstration) trees are representative, authored from general knowledge of each
exam's syllabus structure — **not verified against current official syllabus
documents**. Good enough to build and demo program/exam/syllabus landing pages against;
review against the actual current syllabus before treating any single exam's tree as
authoritative.

## Known gaps

- **Question (MCQ) content**: no per-exam seed script; `questions` table only has the
  illustrative rows from `scripts/seed-curriculum-sample.ts`.
- **Articles/blogs**: same — only the illustrative rows from `scripts/seed-curriculum-sample.ts`.
- **`content_node_map` / `content_exam_map`**: no admin API routes exist yet to attach
  content to a node/exam outside of direct DB seeding (see `src/server/db/schema/content.ts`).

## Adding a new exam

1. If it shares a subject with an existing exam, reuse it from
   `scripts/seed/data/shared-subjects.ts` (or promote an exam-exclusive subject there if
   a second exam now needs it).
2. Otherwise add a `NodeDef` tree to a new or existing file under `scripts/seed/data/`.
3. Add `scripts/seed/exams/<exam>.ts` calling `seedExamCurriculum()` (copy an existing
   one in the same program).
4. Add it to `scripts/seed/run-all.ts` and a `seed:<key>` entry in `package.json`.
5. Update the table above.
