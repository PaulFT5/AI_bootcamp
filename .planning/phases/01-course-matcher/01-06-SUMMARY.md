---
phase: 01-course-matcher
plan: 06
subsystem: data
tags: [syllabus, fise, skipped]

requires:
  - phase: 01-03
    provides: topic mode with inferred topics per AC course (topicsSource = "inferred")
provides: []
affects: [01-course-matcher]

actuals:
  tokens: 0
  tasks: 0
  commits: 1

requirements-completed: []

duration: 0min
completed: 2026-11-21
status: skipped
---

# Phase 1 Plan 06: AC syllabus layer — Skipped

**Skipped by the plan's own D-19 scope override. No tasks ran and no code changed.**

## Why

- The plan's `<scope_override id="D-19">` says to execute no tasks (including the checkpoint) and create only this summary.
- D-20 later made the plan optional rather than restoring it: real fișe topics would replace the Gemini-inferred topics from 01-03. That still needs the AC "Fișele disciplinelor" folders, which can only be downloaded by hand in a browser (RESEARCH: SharePoint-in-WordPress, no static links). `data/raw/fise/` does not exist, so there is nothing to pair or extract.

## Effect on Phase 1

- **MATCH-10** (fișe collection + topic extraction) is deferred to v2. **SC3** (syllabus-to-syllabus comparison) is recorded as waived.
- No course has a `syllabus` row; `has_syllabus` is false on all 204 courses, so the catalogue coverage strip reads 0 of 204 and the "With UPT syllabus" filter shows its empty state.
- Name-mode matches show "Compared by catalogue entry". Topic-mode matches (01-03, D-20) compare against topics inferred from the course name and are labelled "Topics inferred from course name"; no match is ever labelled "Compared with UPT syllabus".

## To pick it up later

1. Download the AC fișe folders (plan 01-01 Task 2 step 3 lists the pages) into `data/raw/fise/AC/<programme>/`.
2. Run this plan with Gemini (`src/llm/gemini.ts`) as the extractor instead of Claude, write topics with `topicsSource = "syllabus"` (seed.ts already refuses to overwrite those with inferred topics), then `npm run embed:courses -- --force` for the changed courses.

---
*Phase: 01-course-matcher*
*Completed: 2026-11-21 (skipped)*
