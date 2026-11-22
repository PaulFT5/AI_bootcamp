---
phase: 01-course-matcher
plan: 04
subsystem: matcher-ui
tags: [nextjs, gemini, pgvector, drizzle, zod, upload, match-cache]

requires:
  - phase: 01-03
    provides: "matchByName / matchByTopics / enrichMatches, src/llm/gemini.ts (embed, generateJson), MatchCard, /api/home-courses, /api/matches"
provides:
  - "D-09 persistence: match_cache keyed by sha256(version, mode, filter, name, description, topics, ects); home_course.matchHash points at the last result; lastMatchesFor() re-reads it without ranking"
  - "PATCH/DELETE /api/home-courses/[id] (user-scoped, PATCH clears the last result), GET/PATCH /api/profile (semesterFilter, homeUniversity)"
  - "/api/matches { homeCourseId, force?, byName? }: force skips the cache (Re-run), byName is the D-20 name fallback"
  - "Full Matcher: saved course list with status, add/edit/delete, Any/Winter/Summer filter, per-course independent runs, Re-run, top 3 + Show more, greyed Weak, coordinator notice, mobile Courses/Matches tabs"
  - "POST /api/extract: syllabus PDF/PNG/JPEG -> Gemini (inline file + JSON schema) -> pre-filled form; Try sample syllabus from a committed pre-parsed JSON"
  - "npm scripts smoke:matcher, smoke:extract"
affects: [01-05]

actuals:
  tokens: 14000
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Services own validation schemas and CRUD (src/services/home-courses.ts, profile.ts); route handlers parse, call, map errors"
    - "Result cache stores ranked ids/scores only; facts are always re-joined from the course row"
    - "Per-request AbortController per course id (match) and one for uploads; state is set only if not aborted"

key-files:
  created:
    - src/services/home-courses.ts
    - src/services/profile.ts
    - src/services/extract.ts
    - src/app/api/home-courses/[id]/route.ts
    - src/app/api/profile/route.ts
    - src/app/api/extract/route.ts
    - src/domain/upload.ts
    - src/domain/upload.test.ts
    - src/lib/downscale.ts
    - src/lib/syllabus-sample.json
    - scripts/smoke-matcher.ts
    - scripts/smoke-extract.ts
    - scripts/fixtures/make-sample-pdf.ts
    - scripts/fixtures/syllabus-sample.pdf
  modified:
    - src/services/matcher.ts
    - src/llm/gemini.ts
    - src/app/api/home-courses/route.ts
    - src/app/api/matches/route.ts
    - src/app/(app)/matcher/page.tsx
    - src/app/(app)/matcher/matcher-view.tsx
    - src/components/match-card.tsx
    - src/app/globals.css
    - package.json
    - .gitattributes

key-decisions:
  - "D-09 via match_cache, not re-ranking on load: the page reads the cached ranked list (one indexed lookup + the usual facts join), so topic-mode courses never re-embed on reload. A course is re-run on mount only if it has no last result or it was matched under another filter"
  - "lastMatchesFor recomputes the hash from the current row and ignores a mismatch, so a run that finishes after an edit cannot resurrect old results"
  - "The cache is shared across users (same input + filter = same ranking); CACHE_VERSION invalidates it when ranking logic changes"
  - "Extraction fields: name, description, ects, studyYear, topics, multipleCoursesDetected (superset of D-20's title/ects/topics); sanitiseExtracted rounds ECTS to halves so the saved form always passes the API"

requirements-completed: [MATCH-02, MATCH-03, MATCH-04, MATCH-09, MATCH-11]

coverage:
  - id: D1
    description: "uploadError (0 bytes, exactly 10,485,760 accepted, +1 rejected with '10.0 MB', unknown type), sniffKind by magic bytes incl. truncated signature, sanitiseExtracted (7.5 kept, 0/75/'6' -> null, 6.2 -> 6, year 2.0 -> 2, 9/2.5 -> null, topics trimmed/capped 30x200, name 200)"
    requirement: MATCH-04
    verification:
      - kind: unit
        ref: "npx vitest run -> Test Files 3 passed, Tests 38 passed (10 new in src/domain/upload.test.ts)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Saved courses + last result in GET /api/home-courses and in the /matcher HTML; cached and forced runs; Winter filter saved and every match odd; bad filter 400; PATCH clears last; blank name / 7.3 ECTS 400; DELETE 204 then 404; other user's PATCH/DELETE 404 and row unchanged"
    requirement: MATCH-02
    verification:
      - kind: e2e
        ref: "npm run build && npm run smoke:matcher -> SMOKE MATCHER OK (name mode only, no Gemini)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Extract: text renamed x.pdf 415, 0 bytes 400, 10,485,761 bytes 413, no file 400; sample PDF sent as 'looks-like.png' -> 200 'Operating Systems Principles', 6 ECTS, year 2, 6 topics"
    requirement: MATCH-04
    verification:
      - kind: e2e
        ref: "npm run smoke:extract -> SMOKE EXTRACT OK (one Gemini generateContent call)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Layout vs prototype at 1440x900 and 390x844 (CDP device emulation), Weak greying, Show more, sample-syllabus form, mobile tabs"
    requirement: MATCH-03
    verification:
      - kind: manual
        ref: "headless Chrome screenshots by the executor"
        status: pass
    human_judgment: true
    rationale: "Plan human-checks (re-login feel, real syllabus PDF and phone screenshot, 15 MB PDF refused with no request in DevTools) still need the user"

duration: about 1 h
completed: 2026-11-22
status: complete
---

# Phase 1 Plan 04: Full Matcher and Syllabus Upload Summary

**The Matcher now keeps each course and its last result across visits (match_cache + matchHash), matches courses independently under a saved Winter/Summer/Any filter, and a one-course syllabus PDF or screenshot pre-fills the course form through Gemini, with a pre-parsed sample and a name-search fallback.**

## Task Commits

1. **Task 1: saved courses, per-course matching, filter** - `a725f39` (feat)
2. **Task 2: syllabus upload via Gemini** - `e15cc43` (feat)
3. Sample PDF kept byte-exact (`*.pdf binary` in .gitattributes) - `d7305b1` (fix)

## Verification (2026-11-22)

| Check | Result |
|---|---|
| `npx vitest run` | Test Files 3 passed (3), Tests 38 passed (38) |
| `npx tsc --noEmit` / `npm run lint` | exit 0 / exit 0 |
| `npm run build` | exit 0; new routes `/api/extract`, `/api/home-courses/[id]`, `/api/profile` |
| `npm run smoke:matcher` | `SMOKE MATCHER OK` |
| `npm run smoke:extract` | `SMOKE EXTRACT OK` |
| `npm run smoke:match` / `smoke:catalogue` / `smoke:auth` | `SMOKE MATCH OK` / `SMOKE CATALOGUE OK` / `SMOKE AUTH OK` |
| `npm run golden` / `npm run golden -- --topics` | `GOLDEN 12/12 negative=PASS` / `GOLDEN 12/12 negative=PASS` |
| Acceptance greps | `.score` in match-card.tsx = 0; writeFile/createWriteStream in extract route + service = 0; sample PDF starts `%PDF-` |

Gemini usage: 1 generateContent (smoke:extract) and about 16 embed calls (smoke:match first run, one visual-check course, golden --topics).

## Interfaces for later plans (01-05)

- `GET /api/home-courses` -> `HomeCourseView[]` = `{ id, name, description, topics, ects, studyYear, source: "typed"|"syllabus", last: { filter, mode, matches: MatchView[] } | null }`; `POST` (body `HomeCourseBody`) -> 201 same shape with `last: null`; `PATCH /api/home-courses/[id]` (partial body) -> 200 view with `last: null`, 404 when not owned; `DELETE` -> 204 / 404.
- `GET/PATCH /api/profile` -> `{ semesterFilter, homeUniversity }` (homeUniversity trimmed, max 200, blank -> null) for the D-14 print header.
- `src/services/home-courses.ts`: `HomeCourseBody`, `listHomeCourses(userId)`, `createHomeCourse`, `updateHomeCourse`, `deleteHomeCourse`; `src/services/profile.ts`: `getProfile`, `updateProfile`, `ProfilePatch`.
- `src/services/matcher.ts`: `lastMatchesFor(homeCourse)`, `matchHomeCourse(userId, id, { force?, byName? })`.
- `MatchCard({ m: MatchView })` renders one `<article class="match band-X">` with the dot, body, and nothing in the third grid column: the prototype's "Add" button (`.match .btn`, full width on phones) goes there as a new child after the body `<div>`. Cards are rendered in `matcher-view.tsx` inside `.matches`, `courseId` is the UPT course id for `la_item`, the active home course id is `activeId`.
- Layout: `.cols` already reserves the 300 px third column at > 1400 px; 01-05 adds `<section className="pane la-col sticky">` and a third `.mtabs` button, then removes the inline `gridTemplateColumns: repeat(2,1fr)` on `.mtabs`.
- npm scripts: `smoke:matcher`, `smoke:extract` (one Gemini call), plus `smoke:match`, `smoke:catalogue`, `smoke:auth`, `golden [-- --topics]`, `test`, `build`, `lint`, `db:*`, `topics:enrich`, `embed:courses`.

## Deviations from Plan

1. **Gemini instead of Claude** (D-20): no `src/llm/claude.ts`, `schemas.ts`, `prompts.ts`; the zod schema and prompt live in `src/services/extract.ts`, `generateJson` gained an optional `files` argument (inline base64 parts before the text).
2. **No rate limiter** on /api/extract (single mock student, D-18); marked `shortcut:` in the route. No 401 paths (D-18).
3. **Honest mode line**: name mode says "Ranked by similarity of course names.", topic mode "Ranked by topic similarity to your syllabus/topics."; the plan's "Ranked by AI from your description" would be false for name mode. A name-mode nudge to add topics or upload a syllabus follows the prototype.
4. **`byName` on /api/matches** and a "Match by name instead" button in the error state of topic-mode courses: the 502 message already promised that fallback.
5. **Topic chips were already in the student's order** (`topicOverlap` walks home topics in order), so match-card only gained the syllabus link / "UPT syllabus not available yet" footer.
6. **smoke-matcher uses name mode only** (no Gemini) and works on the shared mock student: it creates and deletes its own courses and restores the profile filter. smoke-extract skips the 401 case (D-18).
7. **Sample fixture JSON lives at `src/lib/syllabus-sample.json`** so the client imports it with `@/`; the PDF and its generator stay in `scripts/fixtures`.

## Issues Encountered

- `RouteContext<"/api/home-courses/[id]">` needs generated route types: `npx tsc --noEmit` fails until `next typegen` or `next build` has run once.
- git `autocrlf=true` would rewrite the PDF's LF bytes on other checkouts and break xref offsets; fixed with `*.pdf binary`.
- `smoke:match` topic mode now hits match_cache after its first run, so it no longer proves the embed path each time; `golden -- --topics` still does.

## Known limits

- `shortcut:` match_cache is never evicted and not invalidated on reseed; truncate it (or bump `CACHE_VERSION`) after changing course data.
- Image downscale (`src/lib/downscale.ts`) and the browser-side size check were not exercised in a real browser; only the server path was smoked.

## Next Phase Readiness

- Open human checks: re-open /matcher and confirm saved results appear instantly; upload a real fișa PDF and a phone screenshot; try a 15 MB PDF and confirm DevTools shows no request; narrow below 760 px and switch tabs.
- The mock student still has three "Operating systems" courses created by earlier manual testing; they now carry cached name-mode results.

---
*Phase: 01-course-matcher*
*Completed: 2026-11-22*
