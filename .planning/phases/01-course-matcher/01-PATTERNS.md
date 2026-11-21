# Phase 1: Course Matcher - Pattern Map

> **Scope note:** Scope narrowed 2026-11-21 to AC only (D-17, `.planning/phases/01-course-matcher/01-CONTEXT.md`). Multi-faculty content below is reference for a later phase.

**Mapped:** 2026-11-21
**Greenfield repo:** no application code exists. The only analogs are the tracked prototype `.impeccable/mocks/prototype/index.html` (633 lines, git-tracked) and `COLOR-GUIDE.md` (tracked). Everything else: "no analog, follow RESEARCH.md section X".
Line numbers below are from the Read tool on the prototype (+/- 2).
The BOM `"﻿"` in the prototype csv() is the invisible-unicode scan hit, and it is intentional.

## File Classification

| File (per RESEARCH.md structure) | Role | Data Flow | Analog | Quality |
|---|---|---|---|---|
| `src/app/(app)/matcher/*` (home-course form, match cards, loading/empty states) | component | request-response | prototype `renderHome`/`renderMatches` (440-475) | UI-exact |
| `src/app/(app)/catalogue/*` | component | CRUD (read, filter) | prototype `renderCat` (550-559) | UI-exact, minus the English filter (D-02) |
| `src/app/(app)/la/*` + LA side panel | component | CRUD | prototype `laTotals`/`renderLA` (520-546), `toggleLA` | UI-exact |
| `src/app/(app)/la/print/*` + print CSS | component | transform | prototype `.print-only`, `@media print` (~175-190), `printView` | UI-partial (needs header/disclaimer/coordinators, D-14) |
| `src/domain/csv.ts` | utility | transform | prototype `csv()` (577-580) | partial (new columns D-13, add formula guard) |
| `src/domain/ects.ts` | utility | transform | prototype `renderLA` status line (530) | exact logic |
| `src/domain/bands.ts` | utility | transform | none | follow RESEARCH.md Pattern 3 |
| `src/domain/semester.ts`, `normalise.ts`, `ids.ts` | utility | transform | none | follow RESEARCH.md Pattern 3 / Pitfall 13 |
| Faculty colour map (`lib/faculties.ts` or similar) | config | n/a | prototype `FAC` (~339) + `COLOR-GUIDE.md` | exact |
| `app/globals.css` tokens | config | n/a | prototype `:root` (lines 11-16) + `COLOR-GUIDE.md` | exact |
| `src/lib/auth.ts`, `auth-client.ts`, `require-user.ts`, `proxy.ts`, `api/auth/[...all]/route.ts` | config/middleware | request-response | none | follow RESEARCH.md Pattern 1 (copy the code block there) |
| `src/db/schema.ts`, `client.ts`, `docker-compose.yml`, `drizzle.config.ts` | model/config | CRUD | none | follow RESEARCH.md Standard Stack + Pitfall 11 (globalThis pool) |
| `src/llm/claude.ts`, `prompts/`, `schemas.ts` | service | request-response | none | follow RESEARCH.md "Claude Call Shapes" + Pitfall 9 |
| `src/services/matcher.ts`, `extract.ts`, `la.ts`, `catalogue.ts` | service | request-response | none | follow RESEARCH.md Pattern 3 |
| `src/app/api/{matches,extract,la,la/export.csv}/route.ts` | controller | request-response | none | follow RESEARCH.md Pattern 1 `requireUser()` + thin handlers |
| `scripts/import-catalogue.ts`, `pair-fise.ts`, `extract-fise.ts`, `seed.ts`, `golden.ts` | utility | batch / file-I/O | none | follow RESEARCH.md Pattern 2 (copy the `roles` regex table) + Catalogue Import Facts |
| `data/seed/coordinators.json` | config | n/a | none | follow CONTEXT D-16 |
| domain tests (vitest) | test | n/a | none | follow RESEARCH.md Validation Architecture |

## Pattern Assignments

### Matcher UI (match cards, empty/loading)
**Analog:** prototype `renderMatches` (462-475).
- Header copy: `Matches for` / `${name} · ${ects} ECTS` / "Ranked by AI from your syllabus|description. ECTS, semester, faculty and language come from the UPT catalogue." Keep it, because it states the MATCH-03/11 provenance rule.
- Card: `<article class="match band-${band}">`, footer with either a "View UPT syllabus" button or the muted "UPT syllabus not available yet" (the evidence label). The label comes from `course.hasSyllabus`, not from the model.
- Loading: spinner plus "Comparing with UPT courses and their syllabi. This takes a few seconds." plus 3 `.ghost` skeleton cards. Per-course, so one slow call does not block the others (D-08).
- Empty: "No good matches found / Add more topics to the description, or browse the catalogue." plus a Browse catalogue button.
- Mobile: bottom `.mtabs` nav, three tabs (Courses / Matches / LA · N ECTS), under 960px-style breakpoint (lines ~175-182).
- Section `aria-live="polite"` on the matches column (line 263 in grep numbering).
- Changes vs prototype: top 3 plus "Show more" up to 5 (D-05). Bands are Strong/Partial/Weak with no percentages, and Weak is greyed (D-06). Add a "Listed language: X" info line, blank means nothing shown (D-03). Add a Winter/Summer/Any filter (D-04). Show the study year on each card.

### LA panel and meters (D-12)
**Analog:** prototype `renderLA` (525-546). Core excerpt (line 530):
```js
const st = tot===0?["under","Add courses to start your draft."]
 :tot<30?["under",`${30-tot} ECTS to go for a full semester (30).`]
 :tot===30?["at","Full semester: 30 ECTS."]
 :["over",`${tot-30} ECTS over the usual 30. Check with your coordinator.`];
```
Meter segments are coloured per faculty and sized by `e/Math.max(30,tot)*100`%, with a legend and `role="img" aria-label="N of 30 ECTS"`. Winter/Summer tabs show per-semester totals (`Winter · ${t[1]}`). The prototype uses `sem` 1/2; real data uses odd/even catalogue semesters, so map through `domain/semester.ts`. This logic goes in `domain/ects.ts` as a pure function returning a message key plus totals, with the UI rendering the strings. Total turns `--err` colour when over 30.
Changes: LA rows get a "Matched home course" link, or "No home course" in catalogue-added rows, and can be re-linked later (D-11). The prototype shows "Catalogue" instead.

### Catalogue browser
**Analog:** prototype `renderCat` (550-559): filters Faculty, Semester, ECTS, text search (name/code), a syllabus checkbox, and sortable columns. Row = faculty dot, code and name, ECTS, when, language, syllabus, Add/Added button.
Remove: the English-only checkbox and the "Hides N courses" text (D-02). Language becomes plain "Listed language: X".
Add: the D-15 line "Not yet included: ETC, Chemistry, MPT, Communication Sciences. Ask incoming@upt.ro."
Coverage strip (line 558): "UPT syllabi: N of M Automation and Computers courses" / "Other faculties: not collected yet, matched by catalogue keywords". Keep it (honest evidence labelling).

### CSV (`domain/csv.ts`)
**Analog:** prototype `csv()` (577-580):
```js
const text=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
new Blob(["﻿"+text],{type:"text/csv"})  // BOM for Excel; filename learning-agreement-draft.csv
```
Header row becomes D-13: Semester, UPT code, UPT course, Faculty, Programme, Study year, ECTS, Matched home course, Home course ECTS. Add the formula-injection guard (prefix `'` for cells starting with `= + - @`, per RESEARCH.md Pitfall 14). The route handler `api/la/export.csv` serves it server-side.

### Print view
**Analog:** prototype `.print-only{display:none}` plus the `@media print` block (~185-190) and `printView()` (~583). Reuse the hide-chrome/show-print-only mechanism and call `window.print()`. Add the D-14 header (student name, home university, date), disclaimer and per-faculty coordinator contacts.

### Design tokens / faculty colours
**Source:** prototype `:root` (lines 11-16): `--ground:#f5f5f4; --panel:#fff; --ink:#1b1d20; --sub:#4a4f56; --faint:#6b7178; --line:#e2e2df; --accent:#0a6f7e; --accent-soft:#e3f1f3; --warn-bg:#fff6dc; --err:#b3261e; --ok:#1d7a46; --r:8px; --mono:'Red Hat Mono'`.
Faculty map `FAC` (~339): AC `#d4631f`, CT `#2b62b8`, MEC `#2f7d47`, RIA `#7a4fc9`, ET `#c23b5a`, ARH `#8a6a08` (IH is also in the prototype, read the lines after 345). `COLOR-GUIDE.md` is the shared web/app source of truth, so reconcile against it and port the tokens into Tailwind 4 `@theme`. Faculty is always encoded as dot plus text, never colour alone.

## Shared Patterns
- Auth: every handler and server component calls `requireUser()`, with `proxy.ts` as a cookie-only redirect (RESEARCH.md Pattern 1).
- Provenance rule: ECTS, semester, faculty, language, evidence label and coordinator are joined from the DB, never taken from model output (Pattern 3, Pitfall 8).
- Accessibility seen in the prototype: `aria-live` on results, `role="dialog"` drawer with focus return, `aria-label` on icon-only buttons, `prefers-reduced-motion` kill-switch (line 183). Copy these.

## No Analog Found
Everything marked "none" above. Backend, auth, DB, LLM, import scripts and domain logic are all covered only by RESEARCH.md.

## Metadata
**Scope searched:** whole repo (only the prototype and COLOR-GUIDE.md are code-like). **Tracked-source check:** both analogs are in `git ls-files`.
