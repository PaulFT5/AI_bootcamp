# Phase 1: Course Matcher - Context

**Gathered:** 2026-11-21
**Status:** Ready for planning

<domain>
## Phase Boundary

A student hosted by the Faculty of Automation and Computers (AC), entering as the mock test student (D-18), turns their home-university courses (typed, or from a one-course syllabus PDF/screenshot) into ranked, explained matches from the AC courses of the 2026-27 Erasmus catalogue (scope: D-17). Courses with a collected UPT fișa disciplinei are compared syllabus to syllabus; the others are compared by catalogue entry. The student collects matches in a Learning Agreement draft that exports as CSV and as a printable view. Also in scope: the app foundation (Next.js, Docker Postgres+pgvector, a single mock student account instead of real auth (D-18), Claude client) and a filterable AC catalogue browser. Other faculties are deferred (see `<deferred>`). The matching flow, data source, design ("City Lines") and fallbacks are already fixed in ROADMAP.md Phase 1 "Notes for planning" and are not repeated here.

</domain>

<decisions>
## Implementation Decisions

### Language / English status (overrides ROADMAP + MATCH-06)
- **D-01:** Every course in the 2026-27 Erasmus catalogue files counts as open to Erasmus students in English, whatever its language column says (user: "those are english even if not stated as they are proposed to erasmus projects"). Do not treat Romanian/French/German/blank rows as unavailable. — **Reversibility:** costly — reintroducing a language filter touches import, schema, matcher filters and the catalogue UI.
- **D-02:** **Drop the "English-taught only" filter and its hidden-count (MATCH-06 removed).** The planner must update REQUIREMENTS.md and the ROADMAP Phase 1 success criterion 5 to match (done 2026-11-21). The roadmap question "AC Master = English?" is moot as a result.
- **D-03:** Still import and store the language exactly as written in the file (plus the "English materials", "individual study in English" and "recommended for international students" columns where present). Show it as plain info on the course, labelled e.g. "Listed language: Romanian" (blank → nothing shown). It is never used as a filter or for ranking. This still satisfies MATCH-03, which asks for the teaching language to be shown.
  - *(clarified 2026-11-21, user-approved)* The "recommended for international students" value, where the file has one, IS shown to students as plain info next to "Listed language", on match cards and on catalogue rows, as written in the file (e.g. "Recommended for international students: Yes, if participants are familiar with the language…"); blank → nothing shown. It is never a filter, never used for ranking and never sent to Claude. The "English materials" and "individual study in English" values follow MATCH-03 the same way: shown where present on match cards and catalogue rows, nothing when blank.
  - *(AC scope, D-17, measured on the AC file 2026-11-21)* The AC file has a language column (2 rows "ENGLISH - ENGLEZĂ", 202 blank) and no English-materials, individual-study-in-English or recommended-for-international columns. So "Listed language: English" shows on 2 courses and the other three values have nothing to show while only AC is in scope; they are not stored. They come back with the other faculties (`<deferred>`).
- Measured on all 7 files (for awareness only, it does not change D-01; reference for the deferred faculties): about 925 rows Romanian, 8 French, 8 German, 222 blank (202 of them AC); 442 Romanian rows are recommended for internationals with "Yes, if participants are familiar with the language…". Check file produced during discussion: `catalogue-language-check.xlsx` (scratchpad; regenerate from the raw files if needed).

### Match scope & ranking
- **D-04:** An optional semester filter on the Matcher: Winter / Summer / Any (default Any). Odd catalogue semesters = Winter, even = Summer. Study year is shown on each match but never filters, because Erasmus students mix years.
- **D-05:** Show the top 3 matches per home course, with a "Show more" that reveals up to 5. Fetch 5 in one call. The golden-set gate checks top-3.
- **D-06:** Score bands are Strong / Partial / Weak, derived from Claude's numeric score (thresholds are Claude's discretion). No percentages in the UI. Weak matches are shown greyed so that "no good equivalent" is visible.

### Home course entry
- **D-07:** Only the course name is required. Description/topics, ECTS and study year are optional, with a hint that a description improves matches. Upload (MATCH-04) pre-fills the same form.
- **D-08:** Matching runs per course, as soon as the course is added or edited. Each course loads on its own; one slow call does not block the others. Changing the semester filter re-runs matching (cache by normalised input hash + filter).
- **D-09:** Home courses and their last match results are saved to the user's account, so after logging back in the Matcher looks the same. The user can re-run matching on request.
- **D-10:** ~~Sign-in comes first: the whole app (Matcher, catalogue, LA) requires an account. No anonymous mode and no anonymous-to-account migration. (The roadmap's anonymous-cookie fallback remains only as the emergency fallback if Better Auth exceeds its 45-min time box.)~~ **Superseded by D-18.**
- **D-18 (2026-11-21, user-approved):** No real login. Better Auth is dropped (no packages, no session/account/verification tables, no /api/auth route, no sign-in/sign-up pages, no proxy.ts gate, no BETTER_AUTH_* env vars). One mock student row in a minimal `user` table (id `mock-student`, name, email, timestamps), seeded idempotently. `src/lib/session.ts` keeps `requireUser()` and returns the mock user, so every user-scoped table still keys on `user.id` and all saved data persists for the mock account. `/` is a landing page whose "Log in" button (no form) links to `/matcher`. PLAT-01 now means "enter as the mock student, data persists"; real accounts are v2.
- **D-19 (2026-11-21, user-approved):** No AI provider in Phase 1 (no paid API key). Matching is deterministic name similarity in code over the AC catalogue, with template reasons; every match says "Compared by catalogue entry". MATCH-04 (syllabus PDF/screenshot upload) and MATCH-10 (fișe collection + topic extraction) are deferred to v2; SC3 is recorded as waived. No `@anthropic-ai/sdk`, no `ANTHROPIC_API_KEY`, no `src/llm/`. An LLM rerank can be added later behind an optional key without changing the match contract.
- **D-20 (2026-11-21, user-approved, partly supersedes D-19):** AI provider is the Gemini API free tier (key in `.env.local` as GEMINI_API_KEY; GEMINI_MODEL=gemini-3.5-flash-lite, verified working 2026-11-21 while 3.7/3.8-flash returned 503 overload; GEMINI_EMBED_MODEL=gemini-embedding-2 at 768 dims, verified). Two match modes: (1) **name search**: deterministic name similarity in code (D-19 matcher), no AI; (2) **syllabus upload** (MATCH-04 restored): Gemini extracts the uploaded PDF/screenshot to JSON (title, ECTS, topics), the topics are embedded (taskType RETRIEVAL_QUERY) and compared in Postgres with pgvector against stored UPT embeddings. UPT side is enriched offline: each of the 204 AC courses gets 5-12 topics (from its fișa when present = "Compared with UPT syllabus", otherwise inferred from the name = labelled "Topics inferred from course name"), and **only content is embedded: name + topics (+ learning outcomes from a fișa)**, taskType RETRIEVAL_DOCUMENT. Programme, semester, level, ECTS, year and language are NOT embedded: semester and level are exact SQL filters, the rest are facts shown on the card. Reason = topic overlap ("Both cover … · Not at UPT …"). If Gemini fails or rate-limits, upload shows a friendly error and offers name search; a pre-parsed sample syllabus keeps the demo safe. Plan 01-06 stays optional (swap inferred topics for real fișe topics).

### Learning Agreement draft
- **D-11:** Each LA row may link to the home course it replaces. Rows added from the Matcher are linked automatically. Rows added from the catalogue show "No home course" and can be linked later. Several UPT courses may link to one home course.
- **D-12:** ECTS uses two meters, Winter and Summer, each against a target of 30, with the prototype's under/at/over messages for each. A one-semester student simply leaves one empty. Mobility length is not asked.
  - *(clarified 2026-11-21, user-approved: semester placement is catalogue-derived and locked)* An LA course's semester always comes from its catalogue row and can never be changed by the user: a course with an odd catalogue semester (e.g. semester 1) is always under Winter, never Summer, and an even one always under Summer. `la_item` stores no semester or season; the add/relink requests accept no semester field (an extra one is ignored); no UI control moves a course between Winter and Summer.
- **D-13:** CSV columns: Semester, UPT code, UPT course, Faculty, Programme, Study year, ECTS, Matched home course, Home course ECTS.
- **D-14:** Printable view header: student name (from the account), home university (asked once and stored on the profile), date. Below it the table, the suggestions-only disclaimer and the coordinator contact for each faculty in the draft (with D-17: the AC coordinator). Printing uses the browser's print dialog (print CSS), not PDF generation.

### Catalogue gaps & contacts
- **D-15:** *(superseded 2026-11-21 by D-17)* Was: show "Not yet included: ETC, Chemistry, MPT, Communication Sciences. Ask incoming@upt.ro." in the catalogue; no 2021-22 fallback import. Now: the catalogue shows the D-17 scope line instead, and the four missing faculties are listed under `<deferred>` with the other faculties. "No 2021-22 fallback import" still holds.
- **D-16:** *(amended 2026-11-21, user-approved; narrowed 2026-11-21 by D-17)* The coordinator contact (MATCH-09) is hand-curated into a seed JSON (coordinator name, email, source URL, date checked) from the official studies-2026-2027 page https://international.upt.ro/en/incoming-students/erasmus-studies/studies-2026-2027/ (table "Host faculty at Politehnica University Timișoara"). With D-17 only the AC entry is seeded. If the page lists no AC coordinator, show incoming@upt.ro. Reason for the amendment: the page first named here, https://international.upt.ro/en/contact/, lists no per-faculty coordinators (only erasmus.outgoing@upt.ro, student-admissions@upt.ro and phone numbers; RESEARCH Open Question 2), so following it literally would replace the named coordinator with a generic inbox. The other faculties' coordinators (and the MEC/IH/ET cross-check against contacts embedded in their files) move to `<deferred>`.

### Scope (added 2026-11-21, user-approved)
- **D-17:** **Current scope is AC students and AC courses only.** User: "For now the implementation will work only for AC students. Remove any guides that state otherwise."
  - **Data scope = AC courses only.** Import only the Automation and Computers catalogue file (`data/raw/catalogue-2024-27/Course_catalogue_Automatics and Computing_2026-2027_ERASMUS.xlsx`; measured 2026-11-21: 204 rows, 84 Bachelor + 120 Master, 204 distinct codes). The Matcher, the catalogue browser and the Learning Agreement know only AC courses. No faculty filter. One coordinator (AC's).
  - **Other faculties move to "later", they are not deleted.** CT, ET, ARH, IH, MEC, RIA (files already in `data/raw/catalogue-2024-27/`, left untouched) and ETC, Chemistry, MPT, Communication Sciences (files never found) are a deferred / v2 item (`<deferred>`, REQUIREMENTS MATCH-V2-04/05). Their research stays in the research files as reference.
  - **Scope line** (replaces the D-15 line), shown in the catalogue: "Automation and Computers courses only for now. Other faculties: ask incoming@upt.ro."
  - **Changes to earlier decisions:** D-15 superseded; D-16 narrowed to the AC coordinator; D-03's English-materials, individual-study and recommended values have no AC data, so nothing is stored or shown for them now; the import notes below are reduced to the AC file (the other files' notes move to `<deferred>`); D-01..D-14 otherwise unchanged.
  - **Reversibility:** costly. Adding faculties back needs the multi-file import (RESEARCH Pattern 2 and "Catalogue Import Facts"), a faculty filter, per-faculty coordinators and faculty colours (reserved in COLOR-GUIDE.md). The surrogate course id `<FACULTY>-<B|M>-<sheetRow>` is kept, so saved LA rows never need remapping.

### Import notes (AC file, measured 2026-11-21)
- Sheets: "Bachelor 2026-2027" and "Master 2026-2027"; skip "Lista". The header is the first row of both sheets; find it as the first row containing "Course unit", and map columns with header regexes anchored at the start (the language header "Language the course units are taught" also contains "course unit").
- No Faculty column: faculty is AC for every row. Programme name and field of study are filled on every row; the programme description is only on each programme's first row, so forward-fill it only within the same programme (the "Computers (in Romanian)" and "Information Technology (in Romanian)" rows have none).
- Gap rows between programmes have neither course name nor code: skip rows with no course name or no code.
- Names are bilingual ("Databases / Baze de date") and many Master rows start with "Elective N / Opțional N"; keep the full cell. Some codes use lowercase letters (`L002.26.01.f11-01`); keep codes exactly as written.
- The Master sheet has a "10 keywords" column that is empty on every row; the Bachelor sheet has none. There are no hours columns.

### Claude's Discretion
- Thresholds that map the numeric score to Strong/Partial/Weak.
- Exact wording of hints, empty states and the "Listed language" label.
- Where the home-university field is first asked (sign-up vs first print).
- *(planner choice recorded 2026-11-21, after D-17)* Matching shape: with 204 AC courses, one Claude call ranks and explains over the whole prompt-cached AC catalogue (filtered by the semester filter; courses with a collected fișă carry their topics). The roadmap's two-stage shortlist + rank is not needed at this size. A shortlist stage can be put in front of the same function when other faculties return.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria and "Notes for planning" (AC scope, data source, AC file facts, matching flow, AC syllabus manifest, golden set, design), plus "Deferred: other faculties". D-02 and D-17 are already applied there (2026-11-21).
- `.planning/REQUIREMENTS.md` — PLAT-01, MATCH-01..11 (MATCH-06 removed by D-02; AC scope per D-17); v2 MATCH-V2-04/05 for the other faculties.
- `.planning/PROJECT.md` — Key Decisions table.
- `.planning/research/SUMMARY.md` — "Decisions Overriding Research (read first)".
- `.planning/research/SOURCES.md` — official URLs, incl. coordinator contacts page (line 11). Coordinators are now seeded from the studies-2026-2027 page (D-16 amended 2026-11-21).
- `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/FEATURES.md`, `.planning/research/STACK.md`.

### Data
- `data/raw/catalogue-2024-27/Course_catalogue_Automatics and Computing_2026-2027_ERASMUS.xlsx` — the only file imported (D-17). Bachelor and Master sheets only; skip `Lista`. The other six files in the folder (CT `.xlsb`, ET/Power Engineering, ARH, IH, MEC, RIA) stay untouched for later.

### Design
- `prototype/index.html` — working reference prototype (LA panel, 30-ECTS meter messages, CSV export, home-course linking).
- `.impeccable/mocks/colors/`, `.impeccable/mocks/decision/` — shape brief and design decision.
- `PRODUCT.md` — product context for impeccable.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application code yet (greenfield). The prototype `prototype/index.html` is the UI reference: its LA meter logic (under / at 30 / over messages) and CSV export are the behaviour to reproduce.

### Established Patterns
- Stack fixed in `.claude/CLAUDE.md`: Next.js 16 App Router, Drizzle + pg, Better Auth, `@anthropic-ai/sdk` `messages.parse` + `zodOutputFormat`, shadcn/Tailwind 4.
- Business logic in `domain/` + `services/` behind thin route handlers (future mobile reuse).

### Integration Points
- SheetJS `xlsx` reads the AC `.xlsx` file (it also reads the deferred CT `.xlsb`, verified during discussion).

</code_context>

<specifics>
## Specific Ideas

- The user considers the catalogue files the authority: being listed means being offered to Erasmus students in English.
- The LA behaviour should follow the prototype (linking to home courses, 30-ECTS messages, CSV).

</specifics>

<deferred>
## Deferred Ideas

### Other faculties (deferred by D-17, 2026-11-21; not deleted)
- **Already downloaded, not imported:** CT (Civil Engineering, `.xlsb`), ET (Electrical and Power Engineering), ARH (Architecture and Urbanism), IH (Engineering in Hunedoara), MEC (Mechanical Engineering), RIA (Robotics, Artificial Intelligence and Autonomous Systems). Files stay in `data/raw/catalogue-2024-27/`. All 7 files together give 1,327 rows (RESEARCH "Catalogue Import Facts"). REQUIREMENTS MATCH-V2-04.
- **Files never found:** ETC, Chemistry, MPT, Communication Sciences. Import them if the 2026-27 files turn up (was D-15). REQUIREMENTS MATCH-V2-05.
- **What comes back with them:** a faculty filter in the catalogue, one coordinator per faculty from the studies-2026-2027 page (RESEARCH Open Question 2 lists them), faculty colours (reserved in COLOR-GUIDE.md; IH still has none), the D-03 English-materials / individual-study / recommended values (present in some of those files), and their fișe (MATCH-V2-03).
- **Import notes for those files (reference, from discussion and RESEARCH):** MEC and RIA Licenta have a junk row above the header; IH Master has a "Supliment diploma" row under the header; the RIA Licenta sheet has blank rows after the header; MEC has contact text in the Faculty column (never import it as a programme or faculty name); the MEC, IH and ET files embed a faculty contact person, used only to cross-check the studies page; ET Master has three "Year of study" columns (year, semester, ECTS by position); ARH Master has "1st year" cells in the programme column; 102 codes repeat across faculties.

</deferred>

---

*Phase: 01-course-matcher*
*Context gathered: 2026-11-21*
*Updated: 2026-11-21 (D-17 AC-only scope added; D-15 superseded; D-16 narrowed; D-12 clarified: semester placement locked to the catalogue)*
