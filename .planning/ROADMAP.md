# Roadmap: Erasmus@UPT

## Overview

Four vertical slices, in the user's priority order, ahead of the Sunday 2026-11-22 demo. **Current scope (2026-11-21, Phase 1 CONTEXT D-17): students hosted by the Faculty of Automation and Computers (AC) and AC courses only; other faculties come later (see "Deferred: other faculties").** Phase 1 includes the app foundation (Next.js, Postgres+pgvector in Docker, Better Auth, Claude client), so the first thing that runs on the laptop is a working course matcher. Phase 2 adds the source-cited arrival checklist. Phase 3 adds the schedule builder across AC study years and programmes. Phase 4 adds the campus map, reusing the building records from Phase 3. Every phase ends runnable and demoable end-to-end. If Sunday comes early, later phases get cut and earlier ones still work. The RAG chatbot is v2 and has no phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Course Matcher** - Sign up, match home courses to AC courses with reasons and catalogue facts, build and export a Learning Agreement draft (includes app foundation)
- [ ] **Phase 2: Arrival Checklist** - 4-question onboarding that produces a personalised, source-cited pre-arrival and Week 1 checklist with saved progress
- [ ] **Phase 3: Schedule Builder** - Combine AC course slots across study years and programmes into one parity-aware, clash-checked schedule with room decoding and .ics export
- [ ] **Phase 4: Campus Map** - Map of AC buildings, dorms, partner food and services with category filter and directions links

## Phase Details

### Phase 1: Course Matcher
**Goal**: A signed-in student hosted by the Faculty of Automation and Computers (AC) turns their home-university courses (typed, or from a syllabus PDF or screenshot) into ranked, explained matches from the AC courses of the 2026-27 Erasmus catalogue (compared syllabus to syllabus where a UPT fișa disciplinei was collected, otherwise by catalogue entry) and collects them in an exportable Learning Agreement draft
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-07, MATCH-08, MATCH-09, MATCH-10, MATCH-11 (MATCH-06 removed by D-02)
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password, close the browser, reopen the app and still be signed in
  2. User enters one or more home courses (typed, or from an uploaded syllabus) and gets the top AC course matches for each. Each match has a score band, a 1-2 sentence reason, an evidence label ("Compared with UPT syllabus" or "Compared by catalogue entry"), and ECTS, semester, study year, faculty, programme and listed language taken from the catalogue record, plus a notice that these are suggestions only and the AC faculty Erasmus coordinator (contact shown) gives final approval
  3. For a course that has a collected UPT syllabus (fișa disciplinei), the match shows which of the student's topics it covers and which it does not, taken from that fișă
  4. User uploads a one-course syllabus PDF or screenshot, reviews and edits the pre-filled name, description, ECTS and topics, then gets matches for it
  5. User browses the AC courses of the 2026-27 Erasmus catalogue (full-time Bachelor and Master only, no distance learning), labelled with its source year and its AC-only scope, and filters them by semester, ECTS and "has UPT syllabus"; each course shows its listed language as information only (D-01..D-03: no language filter). Courses with a syllabus open a syllabus view with a link to the official PDF
  6. From the Matcher, the student adds courses to a Learning Agreement draft panel with a running ECTS total per semester and opens the full draft from that panel; the full draft exports as CSV and as a printable view, and is unchanged after logging out and back in
**Plans:** 6 plans

Plans:
- [ ] 01-01-PLAN.md — Walking skeleton: Next 16 + Docker Postgres/pgvector + full schema + Better Auth sign-up/sign-in, City Lines shell (wave 1)
- [ ] 01-02-PLAN.md — Catalogue: import the AC file (204 rows), seed with the AC coordinator (studies-2026-2027 page), /catalogue browse + filters (semester, ECTS, syllabus, search), D-17 scope line (wave 2)
- [ ] 01-03-PLAN.md — Matcher engine: one Claude call over the prompt-cached AC catalogue, facts from DB, /api/matches, minimal Matcher, AC golden-set gate (wave 3)
- [ ] 01-04-PLAN.md — Full Matcher UI (saved courses, per-course loading, semester filter, show more) + syllabus PDF/screenshot upload pre-fill (wave 4)
- [ ] 01-05-PLAN.md — Learning Agreement draft: panel with Winter/Summer meters (semester locked to the catalogue), full draft, CSV export, printable view (wave 5)
- [ ] 01-06-PLAN.md — AC fișe (main path for SC3): pair by code, extract topics offline, seed, syllabus view, golden AC case, SC3 met-or-waived sign-off (wave 6)
**UI hint**: yes

**Notes for planning:**
- Foundation is part of this phase, not a separate horizontal phase: Next.js scaffold, `docker-compose.yml` with `pgvector/pgvector:pg17`, Drizzle schema with user-scoped tables, Better Auth (45-min time box, anonymous-cookie fallback), Claude client wrapper. Business logic goes in `domain/` + `services/` behind thin route handlers so the future mobile app can reuse it.
- Scope (decided 2026-11-21, Phase 1 CONTEXT D-17): AC students and AC courses only. The Matcher, catalogue and Learning Agreement know only AC courses; no faculty filter; one coordinator (AC's). Other faculties are deferred, not deleted (see "Deferred: other faculties" below).
- Catalogue source (decided 2026-11-21): the 2026-27 Erasmus Course Catalogue, downloaded by the user into `data/raw/catalogue-2024-27/`. Only the AC file (`Course_catalogue_Automatics and Computing_2026-2027_ERASMUS.xlsx`) is imported: 204 rows (84 Bachelor, 120 Master), 204 distinct codes (measured 2026-11-21). Import only the Bachelor and Master sheets; no distance learning. Skip the `Lista` sheet. The other six files stay in the folder untouched.
- AC file facts (measured 2026-11-21): the header is the first row of both sheets; detect columns by header regex anchored at the start, not by index (the language header also contains "course unit"); no faculty column (faculty = AC); programme and field on every row, programme description only on each programme's first row (forward-fill within the same programme only); gap rows without name or code between programmes; bilingual "EN / RO" names and "Elective N / Opțional N" Master rows (keep the full cell); some codes use lowercase letters (`f11`); language blank on 202 rows and "ENGLISH - ENGLEZĂ" on 2; the Master keywords column is empty and there are no hours, English-materials, individual-study or recommended columns; semesters 1-8 per programme (odd = winter, even = summer).
- Language: per Phase 1 CONTEXT D-01 every course in the 2026-27 catalogue counts as open to Erasmus students in English; the listed language is shown as information only (D-03), never as a filter.
- Syllabus-to-syllabus matching (MATCH-10, MATCH-11) is the main comparison path. Offline: locate each AC course's fișa disciplinei, save PDFs under `data/raw/fise/AC/`, and keep a manifest (catalogue code, course name, local file, original UPT URL, document language, academic year, download date). Pair PDFs to catalogue rows by code; never by guess. Extract topics with Claude offline. The app links to the original UPT URL; local copies are for extraction only. The fișe sit in embedded SharePoint folders on the ac.upt.ro programme pages and must be downloaded in a browser (Phase 1 RESEARCH). AC courses without a collected fișă are matched by catalogue entry and labelled "Compared by catalogue entry"; the app must still work and demo with zero fișe.
- Matching flow: one Claude call ranks over the whole prompt-cached AC catalogue (the semester filter decides which courses are in the cached block; courses with a fișă carry their extracted topics) and returns IDs, scores, reasons and covered/missing topics; IDs checked against the catalogue; facts from the DB. No Voyage key and no shortlist stage: 204 rows fit in one cached call.
- MATCH-04: use UPT "fișa disciplinei" examples as the format reference. One course per PDF; multi-course PDFs are v2 (MATCH-V2-02).
- Quality gate: a golden set of 10-15 known home-to-AC pairs, with top-3 printed, before UI polish.
- Demo safety: cache match results by normalised-input hash so known demo inputs still answer if the API is slow.
- Design (decided 2026-11-21 via /impeccable shape): "City Lines" world, Charcoal + teal variant: charcoal top bar (#1f2328), teal accent (#0a6f7e), light warm-grey ground, white panels, Public Sans + Red Hat Mono for course codes. Signature: each faculty is a coloured line marker with its letters, reused in the LA breakdown, Schedule and Map; only AC (orange `#d4631f`) is in use now, the other faculty colours are reserved in `COLOR-GUIDE.md`. Desktop: home courses | matches | LA draft panel; phone: Courses / Matches / LA tabs. No separate Learning Agreement nav item: the LA draft panel in the Matcher has one teal "Open full draft" button; the full draft page holds CSV export, printable view and "Back to Matcher". Working reference prototype: `.impeccable/mocks/prototype/index.html` (sample data). Shape brief alternatives in `.impeccable/mocks/colors/`.
- Candidate for `/gsd-ai-integration-phase` (Claude rerank, syllabus comparison + PDF extraction).

### Phase 2: Arrival Checklist
**Goal**: A student answers four questions and gets a personalised pre-arrival and Week 1 checklist with deadlines, dependencies and an official source for every item, with progress saved to their account
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: PAPER-01, PAPER-02, PAPER-03, PAPER-04, PAPER-05, PAPER-06
**Success Criteria** (what must be TRUE):
  1. User answers the 4 onboarding questions (citizenship, grant, mobility type, arrival date) and sees a checklist grouped into Pre-arrival and Week 1 that contains only the items that apply to them (e.g. a Non-EU KA171 student sees the visa steps; an EU/EEA KA131 student does not)
  2. Each item shows its deadline, either relative to the arrival date or fixed (such as the nomination deadline). Items past their deadline are flagged as overdue
  3. Items whose prerequisites are not done show as blocked, and unlock as soon as those prerequisites are ticked
  4. Every item shows its official UPT source link, the quoted source text and the date it was verified
  5. User ticks items done, logs out and back in, and sees the same progress
**Plans**: TBD
**UI hint**: yes

**Notes for planning:**
- No AI in this phase. The exit criterion is content accuracy. Rules are hand-curated from the official pages in `research/SOURCES.md` §1 (studies-2026-2027 page, 2026-27 International Students' Guide). Any item without a source is left out. Show an "Informational only — verify with incoming@upt.ro" notice.
- Rules table + pure evaluator (applicability, dependency order, deadlines). Small tests: persona combinations, date edges, no dependency cycles, every rule has a source.
- Traineeship-specific items are v2 (PAPER-V2-02). A Traineeship answer still gets the shared items.

### Phase 3: Schedule Builder
**Goal**: A student combines AC course slots from different study years and programmes into one clash-checked weekly schedule that respects odd/even weeks, shows where each room is, and exports to their calendar
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, PLAT-02
**Success Criteria** (what must be TRUE):
  1. User searches for a course (e.g. "OOP") in real AC timetables pre-loaded for several study years and programmes, sees all its lecture, lab and seminar slots on the weekly grid, and picks slots from different years and programmes into one personal schedule
  2. Overlapping slots are highlighted. Same-hour slots in opposite-parity weeks or in non-overlapping week ranges are not flagged. User can switch the grid between odd-week and even-week views, and for a course with several lab/seminar subgroups the app suggests one that does not clash
  3. Each class shows its decoded room (e.g. B417 → wing B, floor 4, room 17) with a Google Maps link to the building. Unknown codes show "not in our map yet"
  4. User exports an .ics file that imports into Google Calendar and Apple Calendar with every event on the correct date and Europe/Bucharest time, only in its parity weeks, and none on holidays or vacation weeks
  5. After logging out and back in, the user's Learning Agreement draft, checklist ticks and schedule all come back exactly as they left them
**Plans**: TBD
**UI hint**: yes

**Notes for planning:**
- Verification gate before .ics (SCHED-08): confirm the UPT odd/even parity convention and the Week 1 anchor against the official 2026-27 calendar (check it visually; the Senate PDF text is garbled) and the real AC legend. Keep the anchor as a config constant. Other faculties may use another convention (deferred; MPT's legend `p = even / i = odd` is reference for later).
- Expand classes into explicit dated occurrences (not RRULE `INTERVAL=2`, which is wrong across the winter break). Tests: no events on 2026-11-30, 2026-12-01 or 2026-12-25; correct across the 2026-12-14 → 2027-01-11 boundary; opposite-parity slots at the same hour do not clash.
- Seed timetables: AC only (scope D-17), from the AC past-semester Google Sheet CSV, covering several study years and programmes. Seed S1 and S2 2026-27 and label the academic year in the UI. The MPT xlsx, SC xlsx and MEC timetables are deferred with the other faculties (SCHED-V2-03; MEC/CT PDFs show no parity markers).
- Room decoder is an explicit table built from the official AC legend; never infer codes. The building records (code, name, coordinates, Google Maps link) are the location data Phase 4 reuses.
- Fallback if time runs short: the SCHED-06 suggestion becomes greyed-out clashing subgroups without auto-pick.
- Out of this phase (v2): AI timetable extractor (SCHED-V2-01), auto-loading the LA draft into the schedule (SCHED-V2-02).

### Phase 4: Campus Map
**Goal**: A student finds the AC faculty buildings, dorms, UPT-owned or partner food places and key services on a map and opens directions to any of them
**Mode:** mvp
**Depends on**: Phase 3 (reuses its building records)
**Requirements**: MAP-01, MAP-02, MAP-03
**Success Criteria** (what must be TRUE):
  1. User sees a campus map with UPT points of interest: AC faculty buildings, dorms, UPT-owned or partner food & cafés, and services (library card desk, student clinic, sports complex, International Relations Office)
  2. User filters points of interest by category and sees only that category
  3. User selects a point of interest and sees its name, what it is, hours if known, its source and a Google Maps directions link
  4. An AC faculty building opens the same Google Maps location from the map as from a schedule room link
**Plans**: TBD
**UI hint**: yes

**Notes for planning:**
- Sources: `research/SOURCES.md` §3 (maps.upt.ro, campus map PDF, dormitories directory, restaurants page, 2026 facilities guide). Only UPT-owned or partner places. Canteen data from the 2023 guide is labelled "as of 2023 guide" or left out. Do not promise free clinic care for insured students.
- Decide the rendering approach in discuss-phase. Research lists a full interactive map as an anti-feature. A static campus image or a simple tile map plus a filterable list both satisfy MAP-01.
- This is the last phase, so it is the first cut if time runs out. Phases 1-3 stay demoable without it.
- Other faculties' buildings are deferred with the other faculties (MAP-V2-01).

## Deferred: other faculties

Scope was narrowed on 2026-11-21 to students hosted by the Faculty of Automation and Computers and to AC courses (Phase 1 CONTEXT D-17). The other faculties are moved to later, not deleted; their research stays in `.planning/research/` and Phase 1 RESEARCH as reference.

- **Catalogue (MATCH-V2-04):** CT, ET, ARH, IH, MEC and RIA files are already in `data/raw/catalogue-2024-27/` (left untouched). All 7 files give 1,327 rows; their import hazards are measured in Phase 1 RESEARCH "Catalogue Import Facts". With them come back a faculty filter, one coordinator per faculty (studies-2026-2027 page) and faculty colours (reserved in `COLOR-GUIDE.md`).
- **Missing catalogue files (MATCH-V2-05):** ETC, Chemistry, MPT and Communication Sciences 2026-27 files were never found.
- **Syllabi (MATCH-V2-03):** fișe of the other faculties for syllabus-to-syllabus matching.
- **Timetables (SCHED-V2-03):** MPT, SC and MEC timetables, each with its parity convention checked.
- **Buildings (MAP-V2-01):** other faculties' buildings on the campus map.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Course Matcher | 0/0 | Not started | - |
| 2. Arrival Checklist | 0/0 | Not started | - |
| 3. Schedule Builder | 0/0 | Not started | - |
| 4. Campus Map | 0/0 | Not started | - |
