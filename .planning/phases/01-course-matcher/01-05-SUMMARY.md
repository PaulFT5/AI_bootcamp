---
phase: 01-course-matcher
plan: 05
subsystem: learning-agreement
tags: [nextjs, drizzle, zod, csv, print]

requires:
  - phase: 01-04
    provides: "MatchCard, matcher-view (activeId, .cols, .mtabs), /api/home-courses, GET/PATCH /api/profile (homeUniversity)"
provides:
  - "src/domain/ects.ts: ECTS_TARGET, laTotals (catalogue semester parity -> winter/summer), meterStatus (D-12 messages)"
  - "src/domain/csv.ts: LA_CSV_HEADER (D-13), toCsv (BOM, CRLF, quoting, formula guard)"
  - "src/services/la.ts: listLa, addLa, removeLa, relinkLa, laCsvRows, laCoordinators (all user-scoped)"
  - "GET/POST/DELETE /api/la, PATCH /api/la/[id], GET /api/la/export"
  - "LA panel in the Matcher (Winter + Summer meters, mobile 'LA · N ECTS' tab), /la full draft, /la/print, catalogue Add column"
  - "npm script smoke:la"
affects: []

actuals:
  tokens: 60000
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "LA placement is never stored: listLa joins the course row and derives season(course.semester); zod strip mode drops semester/season keys"
    - "Smoke scripts on the shared mock student set its LA rows aside and restore them in finally"

key-files:
  created:
    - src/domain/ects.ts
    - src/domain/ects.test.ts
    - src/domain/csv.ts
    - src/domain/csv.test.ts
    - src/services/la.ts
    - src/app/api/la/route.ts
    - src/app/api/la/[id]/route.ts
    - src/app/api/la/export/route.ts
    - src/components/la-panel.tsx
    - src/components/add-to-la-button.tsx
    - src/app/(app)/la/page.tsx
    - src/app/(app)/la/la-table.tsx
    - src/app/(app)/la/print/page.tsx
    - src/app/(app)/la/print/print-button.tsx
    - scripts/smoke-la.ts
  modified:
    - src/components/match-card.tsx
    - src/app/(app)/matcher/matcher-view.tsx
    - src/app/(app)/matcher/page.tsx
    - src/app/(app)/catalogue/page.tsx
    - src/app/globals.css
    - package.json

key-decisions:
  - "Both meters always visible (plan), instead of the prototype's Winter/Summer tabs; one AC-coloured bar each, no legend (D-17)"
  - "Add from a match card is optimistic and rolls back with a toast on failure; the toast is local state on the existing .toast CSS (no toast library)"
  - "A second add of the same course returns 200 and keeps the existing home-course link (onConflictDoNothing)"
  - "DELETE /api/la is idempotent: 204 even if the course was not in the draft"
  - "Print coordinators come from the draft's faculties; an empty draft still shows the AC coordinator"

requirements-completed: [MATCH-07, MATCH-08, MATCH-09]

coverage:
  - id: D1
    description: "meterStatus at 0/1/29/30/31, laTotals parity incl. sem 9; toCsv BOM+CRLF, comma/quote quoting, = + - @ tab CR guard (numbers never), guard+quote together, empty cells, Romanian diacritics, D-13 header"
    requirement: MATCH-07
    verification:
      - kind: unit
        ref: "npx vitest run -> Test Files 5 passed (5), Tests 53 passed (53) (7 ects + 8 csv new)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Add from matcher linked (201), duplicate (200, one row), unknown course 404, other user's home course 404, /matcher HTML has 'Open full draft' + code, remove 204; sem-1 course posted with semester 2/season Summer listed as Winter; no semester/season column on la_item"
    requirement: MATCH-07
    verification:
      - kind: e2e
        ref: "npm run smoke:la -> SMOKE LA OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "Empty export = BOM + header; 3 rows (two linked to '=HYPERLINK(\"x\")' 7.5 ECTS, one catalogue) match exact expected lines, Winter before Summer then code, same order in GET /api/la and /la/print; relink 200; PATCH with semester/season keeps Winter; other user's LA row PATCH 404 and absent from export; /la/print has name, home university, en-GB Bucharest date, disclaimer, coordinator email"
    requirement: MATCH-08
    verification:
      - kind: e2e
        ref: "npm run smoke:la -> CSV 3 rows ok; relink/IDOR ok; print ok / SMOKE LA OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Matcher with LA panel (1440x900), LA tab on 390x844, /la, /la/print (screen and emulated print media), catalogue Added state"
    requirement: MATCH-08
    verification:
      - kind: manual
        ref: "headless Chrome screenshots by the executor"
        status: pass
    human_judgment: true
    rationale: "CSV in Excel/LibreOffice and the real browser print dialog still need the user"

duration: about 40 min
completed: 2026-11-22
status: complete
---

# Phase 1 Plan 05: Learning Agreement Draft Summary

**Students add matched or catalogue UPT courses to a saved Learning Agreement draft, see Winter and Summer ECTS meters in the Matcher, link each row to a home course on /la, export a D-13 CSV and print a D-14 draft; Winter/Summer always comes from the catalogue row.**

## Task Commits

1. **Task 1: LA panel, meters, Add on match cards** - `87de743` (feat)
2. **Task 2: full draft page, linking, CSV, print, catalogue Add** - `fab5b84` (feat)
3. Draft table: faculty name beside its dot, full home-course names in the select - `ec7aaa5` (fix, from the visual check)

## Verification (2026-11-22)

| Check | Result |
|---|---|
| `npx vitest run` | Test Files 5 passed (5), Tests 53 passed (53) |
| `npx tsc --noEmit` / `npm run lint` | exit 0 / exit 0 |
| `npm run build` | exit 0; new routes `/api/la`, `/api/la/[id]`, `/api/la/export`, `/la`, `/la/print` |
| `npm run smoke:la` | `SMOKE LA OK` |
| `npm run smoke:matcher` / `smoke:catalogue` / `smoke:auth` | `SMOKE MATCHER OK` / `SMOKE CATALOGUE OK` / `SMOKE AUTH OK` |
| Acceptance greps | all as expected; top-bar "learning agreement" = 0; la-table `name="semester|season"` = 0 |

No Gemini calls (smoke:la uses name-mode matching).

## Deviations from Plan

1. **D-18 mock account:** no 401 paths and no second signed-in user. IDOR is checked by inserting another user's home course and LA row through `pg` and asserting 404 / absence from the mock student's export.
2. **Print hides `.side`, not `.top`:** the app's top bar is `<header class="side">`. The print rules hide `.side`, `.data-note`, `.mtabs`, `.toast`, `.no-print`; the old `.print-only` rules were removed (unused).
3. **`laCoordinators(rows)`** added to the LA service so the print page shows the AC coordinator even for an empty draft, without the page querying the DB itself.
4. **listLa returns `coordinator: { name, email, sourceUrl, checkedOn }`** rather than flat fields.
5. **Fix commit** after the screenshots (faculty cell wrapped under the dot; selects truncated home-course names).

## Known limits

- Two rapid toggles of the same card can race (no per-course request queue); fine for one student clicking.
- The mobile LA tab label sums both seasons ("LA · 26 ECTS"), as the plan's flagged assumption says.
- The mock student's profile already held `homeUniversity = "Smoke University 1795335680442"` before this plan (left by an earlier smoke); it shows on /la and /la/print until changed. smoke:la restores whatever value it found.

## Next Phase Readiness

- Open human checks: open the CSV in Excel and LibreOffice (diacritics, `'=HYPERLINK` shown as text); press Print on /la/print and look at the preview; add matches until Winter passes 30 and watch the total turn red.
- Screenshots: `C:\Users\buciu\AppData\Local\Temp\claude\a5903f894cb24e18\e3cdaa83-804d-4e58-a1ad-d42802a05089\scratchpad\la05\` (matcher-1440, matcher-390-la, la-1440, la-print-media, catalogue-1440).

---
*Phase: 01-course-matcher*
*Completed: 2026-11-22*
