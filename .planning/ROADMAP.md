# Roadmap: Erasmus@UPT

## Overview

Four vertical slices, in the user's priority order, ahead of the Sunday 2026-11-22 demo. Phase 1 includes the app foundation (Next.js, Postgres+pgvector in Docker, Better Auth, Claude client), so the first thing that runs on the laptop is a working course matcher. Phase 2 adds the source-cited arrival checklist. Phase 3 adds the cross-faculty schedule builder. Phase 4 adds the campus map, reusing the building records from Phase 3. Every phase ends runnable and demoable end-to-end. If Sunday comes early, later phases get cut and earlier ones still work. The RAG chatbot is v2 and has no phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Course Matcher** - Sign up, match home courses to UPT courses with reasons and catalogue facts, build and export a Learning Agreement draft (includes app foundation)
- [ ] **Phase 2: Arrival Checklist** - 4-question onboarding that produces a personalised, source-cited pre-arrival and Week 1 checklist with saved progress
- [ ] **Phase 3: Schedule Builder** - Combine course slots across faculties and years into one parity-aware, clash-checked schedule with room decoding and .ics export
- [ ] **Phase 4: Campus Map** - Map of UPT buildings, dorms, partner food and services with category filter and directions links

## Phase Details

### Phase 1: Course Matcher
**Goal**: A signed-in student turns their home-university courses (typed or from a syllabus PDF) into ranked, explained UPT matches with catalogue facts and collects them in an exportable Learning Agreement draft
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07, MATCH-08, MATCH-09
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password, close the browser, reopen the app and still be signed in
  2. User enters one or more home courses and gets the top UPT matches for each. Each match has a score band, a 1-2 sentence reason, and ECTS, semester, study year, faculty, programme and English status taken from the catalogue record, plus a notice that these are suggestions only and the named faculty Erasmus coordinator (contact shown) gives final approval
  3. User uploads a one-course syllabus PDF, reviews and edits the pre-filled name, description, ECTS and topics, then gets matches for it
  4. User browses the full catalogue, which is labelled with its source year (e.g. "snapshot 2021-22"), and filters it by faculty, semester, ECTS and English status. "English-taught only" is on by default and shows how many courses it hides
  5. User adds matches to a Learning Agreement draft with a running ECTS total, finds it unchanged after logging out and back in, and exports it as CSV and as a printable view
**Plans**: TBD
**UI hint**: yes

**Notes for planning:**
- Foundation is part of this phase, not a separate horizontal phase: Next.js scaffold, `docker-compose.yml` with `pgvector/pgvector:pg17`, Drizzle schema with user-scoped tables, Better Auth (45-min time box, anonymous-cookie fallback), Claude client wrapper. Business logic goes in `domain/` + `services/` behind thin route handlers so the future mobile app can reuse it.
- Research flag (catalogue ingest): run a 30-min parse spike on the 2021-22 `.xls` set before planning ingest tasks. Known hazards: merged programme cells, a shifting language column, bilingual "EN - RO" strings, no faculty column. The current 2024-27 catalogue is on SharePoint and the user must download it manually (first action item). Time-box ingest. Start the matcher on a hand-written ~20-course seed so it can be demoed before ingest finishes.
- MATCH-04: use UPT "fișa disciplinei" examples as the format reference. One course per PDF; multi-course PDFs are v2 (MATCH-V2-02).
- Quality gate: a golden set of 10-15 known home-to-UPT pairs, with top-3 printed, before UI polish. The LLM returns only course IDs, scores and reasons; IDs are checked against the candidate set; facts come from the DB.
- Plan B if there is no Voyage key by Saturday noon: Claude-only ranking over a prompt-cached compact catalogue.
- Demo safety: cache match results by normalised-input hash so known demo inputs still answer if the API is slow.
- Candidate for `/gsd-ai-integration-phase` (Claude rerank + PDF extraction).

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
**Goal**: A student combines course slots from different faculties and study years into one clash-checked weekly schedule that respects odd/even weeks, shows where each room is, and exports to their calendar
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, PLAT-02
**Success Criteria** (what must be TRUE):
  1. User searches for a course (e.g. "OOP") in real timetables pre-loaded for at least 2-3 faculties, sees all its lecture, lab and seminar slots on the weekly grid, and picks slots from different faculties and years into one personal schedule
  2. Overlapping slots are highlighted. Same-hour slots in opposite-parity weeks or in non-overlapping week ranges are not flagged. User can switch the grid between odd-week and even-week views, and for a course with several lab/seminar subgroups the app suggests one that does not clash
  3. Each class shows its decoded room (e.g. B417 → wing B, floor 4, room 17) with a Google Maps link to the building. Unknown codes show "not in our map yet"
  4. User exports an .ics file that imports into Google Calendar and Apple Calendar with every event on the correct date and Europe/Bucharest time, only in its parity weeks, and none on holidays or vacation weeks
  5. After logging out and back in, the user's Learning Agreement draft, checklist ticks and schedule all come back exactly as they left them
**Plans**: TBD
**UI hint**: yes

**Notes for planning:**
- Verification gate before .ics (SCHED-08): confirm the UPT odd/even parity convention and the Week 1 anchor against the official 2026-27 calendar (check it visually; the Senate PDF text is garbled) and one real legend (AC legend, or MPT `p = even / i = odd`). Keep the anchor as a config constant. Faculties may differ.
- Expand classes into explicit dated occurrences (not RRULE `INTERVAL=2`, which is wrong across the winter break). Tests: no events on 2026-11-30, 2026-12-01 or 2026-12-25; correct across the 2026-12-14 → 2027-01-11 boundary; opposite-parity slots at the same hour do not clash.
- Seed timetables: AC past-semester Google Sheet CSV, MPT xlsx, SC xlsx. Add MEC only if its parity check passes (MEC/CT PDFs show no parity markers). Seed S1 and S2 2026-27 and label the academic year in the UI.
- Room decoder is an explicit table built from the official AC legend; never infer codes. The building records (code, name, coordinates, Google Maps link) are the location data Phase 4 reuses.
- Fallback if time runs short: the SCHED-06 suggestion becomes greyed-out clashing subgroups without auto-pick.
- Out of this phase (v2): AI timetable extractor (SCHED-V2-01), auto-loading the LA draft into the schedule (SCHED-V2-02).

### Phase 4: Campus Map
**Goal**: A student finds UPT faculty buildings, dorms, UPT-owned or partner food places and key services on a map and opens directions to any of them
**Mode:** mvp
**Depends on**: Phase 3 (reuses its building records)
**Requirements**: MAP-01, MAP-02, MAP-03
**Success Criteria** (what must be TRUE):
  1. User sees a campus map with UPT points of interest: faculty buildings, dorms, UPT-owned or partner food & cafés, and services (library card desk, student clinic, sports complex, International Relations Office)
  2. User filters points of interest by category and sees only that category
  3. User selects a point of interest and sees its name, what it is, hours if known, its source and a Google Maps directions link
  4. A faculty building opens the same Google Maps location from the map as from a schedule room link
**Plans**: TBD
**UI hint**: yes

**Notes for planning:**
- Sources: `research/SOURCES.md` §3 (maps.upt.ro, campus map PDF, dormitories directory, restaurants page, 2026 facilities guide). Only UPT-owned or partner places. Canteen data from the 2023 guide is labelled "as of 2023 guide" or left out. Do not promise free clinic care for insured students.
- Decide the rendering approach in discuss-phase. Research lists a full interactive map as an anti-feature. A static campus image or a simple tile map plus a filterable list both satisfy MAP-01.
- This is the last phase, so it is the first cut if time runs out. Phases 1-3 stay demoable without it.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Course Matcher | 0/0 | Not started | - |
| 2. Arrival Checklist | 0/0 | Not started | - |
| 3. Schedule Builder | 0/0 | Not started | - |
| 4. Campus Map | 0/0 | Not started | - |
