# Requirements: Erasmus@UPT

**Defined:** 2026-11-20
**Core Value:** An incoming student can enter their home-university courses and get ranked, explained UPT course matches (ECTS, semester, faculty, English status) they can put straight into their Learning Agreement.

## v1 Requirements

Requirements for the Sunday 2026-11-22 demo. Each maps to roadmap phases. Details will be re-discussed per phase during implementation (user: "discuss all the details again while implementing").

**Current scope (2026-11-21, Phase 1 CONTEXT D-17):** students hosted by the Faculty of Automation and Computers (AC) and AC courses only. Other faculties are v2 (see "Other faculties" under v2 Requirements).

### Platform

- [ ] **PLAT-01**: User can create an account with email and password and stay logged in across browser sessions
- [ ] **PLAT-02**: User's Learning Agreement draft, checklist progress and schedule are saved to their account and restored on next login

### Course Matcher

- [ ] **MATCH-01**: The AC courses of the UPT catalogue are available in the app, imported from the Automation and Computers file of the official 2026-27 Erasmus Course Catalogue (full-time Bachelor and Master only, no distance learning), labelled with its source year and its AC-only scope in the UI (other faculties: MATCH-V2-04)
- [ ] **MATCH-02**: User can enter one or more home-university courses (name, description, ECTS, study year) and get the top UPT (AC) matches for each, ranked with a score band and a 1-2 sentence reason
- [ ] **MATCH-03**: Each match shows ECTS, semester, study year, faculty, programme and teaching language as listed (plus the "English materials" / "individual study in English" flags where the catalogue has them; the AC file has none), taken from catalogue data, never from model output
- [ ] **MATCH-04**: User can upload a home-course syllabus as a PDF or a screenshot (PNG/JPEG); files that are too large are rejected before upload with a clear message stating the limit, and screenshots are downscaled in the browser to fit; the course name, description, ECTS and topics are extracted and pre-filled for the user to review, then matched (format reference: UPT "fișa disciplinei" examples; one course per PDF)
- [ ] **MATCH-05**: User can browse the AC catalogue and filter by semester, ECTS and "has UPT syllabus"; each course shows its listed language as information only (D-03); there is no faculty filter while only AC is in scope (D-17)
- **MATCH-06**: *Removed 2026-11-21 by Phase 1 CONTEXT D-02.* Every course in the 2026-27 Erasmus catalogue counts as offered to Erasmus students in English (D-01), so there is no English-taught-only filter and no hidden-course count.
- [ ] **MATCH-07**: User can add matched UPT courses to a Learning Agreement draft that shows the running ECTS total
- [ ] **MATCH-08**: The Learning Agreement draft panel in the Matcher opens the full draft page, which exports the draft as CSV and as a printable view (no separate Learning Agreement navigation item)
- [ ] **MATCH-09**: Match results show that suggestions are not official equivalences and that final approval is by the AC faculty Erasmus coordinator, with that coordinator's contact
- [ ] **MATCH-10**: UPT syllabi (fișa disciplinei) for Automation and Computers catalogue courses are collected offline with a manifest (catalogue code, local file, original UPT URL, document language, academic year, download date), paired to catalogue rows by code, and can be opened from the catalogue and from matches via the official UPT link; courses without one show "Syllabus not available yet"
- [ ] **MATCH-11**: Each match shows how it was compared ("Compared with UPT syllabus" or "Compared by catalogue entry"); for AC courses with a syllabus, matching compares the home course with the topics extracted from the UPT syllabus and shows which of the student's topics are covered and which are not

### Paperwork & Legal

- [ ] **PAPER-01**: User answers 4 onboarding questions: citizenship (EU/EEA vs Non-EU), grant (KA131 vs KA171), mobility type (Study vs Traineeship), arrival date
- [ ] **PAPER-02**: User sees a personalised checklist grouped into pre-arrival and Week 1, containing only items that apply to their answers
- [ ] **PAPER-03**: Each item shows its deadline (relative to arrival date, or fixed such as nomination deadlines) and overdue items are flagged
- [ ] **PAPER-04**: Items that depend on other items stay blocked until their prerequisites are ticked
- [ ] **PAPER-05**: Each item shows its official UPT source link, the quoted source text and the date it was verified (content is hand-curated from official guides, never LLM-generated)
- [ ] **PAPER-06**: User can tick items as done and their progress persists

### Schedule Builder

- [ ] **SCHED-01**: Real AC timetable data (several study years and programmes) is pre-loaded into the app (other faculties: SCHED-V2-03)
- [ ] **SCHED-02**: User can pick an AC course from any study year or programme (e.g., "OOP") and see all its available slots (lecture, lab, seminar options) on the weekly grid
- [ ] **SCHED-03**: User can select slots to build one personal schedule combining AC courses from different study years and programmes
- [ ] **SCHED-04**: Overlapping slots are detected and highlighted, taking odd/even weeks and week ranges (e.g., weeks 1-7) into account
- [ ] **SCHED-05**: User can switch the grid between odd-week and even-week views
- [ ] **SCHED-06**: When a course has multiple lab/seminar subgroups, the app suggests a conflict-free subgroup choice
- [ ] **SCHED-07**: Each class shows decoded room details (e.g., B417 → wing B, floor 4, room 17) with a Google Maps link to the building; unknown codes show a "not in our map yet" fallback
- [ ] **SCHED-08**: User can export their schedule as an .ics file whose events land on the correct dates and times (Europe/Bucharest, odd/even weeks respected, holidays and vacation skipped)

### Campus Map

- [ ] **MAP-01**: User sees a campus map with UPT points of interest: AC faculty buildings, dorms, UPT-owned or partner food & cafés, and services (library card desk, student clinic, sports complex, International Relations Office)
- [ ] **MAP-02**: User can filter points of interest by category
- [ ] **MAP-03**: User can select a point of interest to see its details (name, what it is, hours if known, source) and a Google Maps directions link

## v2 Requirements

Deferred. Tracked but not in the current roadmap.

### Schedule

- **SCHED-V2-01**: AI timetable extractor — upload a PDF, screenshot or text from faculty portals; Claude extracts rows into an editable review table before saving
- **SCHED-V2-02**: Courses in the Learning Agreement draft auto-load into the schedule builder

### Paperwork

- **PAPER-V2-01**: Grounded RAG chatbot over official UPT mobility guides with exact citations (stretch: build only if all v1 is done before Sunday)
- **PAPER-V2-02**: Traineeship-specific checklist items
- **PAPER-V2-03**: Campus utilities info page (canteen hours, library card rules, clinic details) beyond the map's POI details

### Matcher

- **MATCH-V2-01**: Evaluation type (exam/colloquium/verification) enriched from UPT study-plan PDFs
- **MATCH-V2-02**: Syllabus/transcript PDFs containing multiple courses, with every course extracted and matched
- **MATCH-V2-03**: UPT syllabi collected and matched syllabus-to-syllabus for the faculties beyond Automation and Computers

### Other faculties (deferred by Phase 1 CONTEXT D-17, 2026-11-21)

- **MATCH-V2-04**: Import the 2026-27 catalogue files of the other faculties already downloaded (CT, ET, ARH, IH, MEC, RIA; in `data/raw/catalogue-2024-27/`), with a faculty filter in the catalogue, one coordinator per faculty and faculty colours (reserved in `COLOR-GUIDE.md`)
- **MATCH-V2-05**: Find and import the 2026-27 catalogue files of ETC, Chemistry, MPT and Communication Sciences
- **SCHED-V2-03**: Timetables of other faculties (e.g. MPT, SC, MEC) in the schedule builder, each with its odd/even parity convention checked
- **MAP-V2-01**: Other faculties' buildings on the campus map

### Platform

- **PLAT-V2-01**: Documented API for the colleague's mobile app (business logic is already kept behind a clean server boundary in v1)
- **PLAT-V2-02**: Hosted deployment (hosted Postgres such as Neon — a `DATABASE_URL` change)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native / cross-platform mobile app | A colleague builds mobile; this project is web only |
| Online Learning Agreement (OLA) submission or signing | Official EU system; the app only drafts |
| Claiming "official equivalence" | Only faculty coordinators approve; app shows suggestions |
| UPT SSO / Student UPT portal login | Students have no UPT credentials before in-person registration |
| Live runtime scraping of upt.ro | Fragile and slow; data is pre-processed into seed files |
| LLM-generated checklist content | Wrong legal/admin advice harms students; content is hand-curated with sources |
| Indoor floor plans / turn-by-turn indoor navigation | No source data; room decoding + Google Maps link instead |
| Non-UPT, non-partner businesses on the map | User wants only UPT-owned or partner places |
| Romanian UI / other languages | English-first is the point for v1 |
| Reviews, social features, community | Not core; moderation burden |

## Traceability

Which phases cover which requirements. Filled during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 3 | Pending |
| MATCH-01 | Phase 1 | Pending |
| MATCH-02 | Phase 1 | Pending |
| MATCH-03 | Phase 1 | Pending |
| MATCH-04 | Phase 1 | Pending |
| MATCH-05 | Phase 1 | Pending |
| MATCH-06 | Phase 1 | Removed (D-02) |
| MATCH-07 | Phase 1 | Pending |
| MATCH-08 | Phase 1 | Pending |
| MATCH-09 | Phase 1 | Pending |
| MATCH-10 | Phase 1 | Pending |
| MATCH-11 | Phase 1 | Pending |
| PAPER-01 | Phase 2 | Pending |
| PAPER-02 | Phase 2 | Pending |
| PAPER-03 | Phase 2 | Pending |
| PAPER-04 | Phase 2 | Pending |
| PAPER-05 | Phase 2 | Pending |
| PAPER-06 | Phase 2 | Pending |
| SCHED-01 | Phase 3 | Pending |
| SCHED-02 | Phase 3 | Pending |
| SCHED-03 | Phase 3 | Pending |
| SCHED-04 | Phase 3 | Pending |
| SCHED-05 | Phase 3 | Pending |
| SCHED-06 | Phase 3 | Pending |
| SCHED-07 | Phase 3 | Pending |
| SCHED-08 | Phase 3 | Pending |
| MAP-01 | Phase 4 | Pending |
| MAP-02 | Phase 4 | Pending |
| MAP-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 30 total (MATCH-06 removed by Phase 1 D-02, so 29 active)
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-20*
*Last updated: 2026-11-21 after Phase 1 re-scope to AC only (D-17: MATCH-01/03/05/09, SCHED-01..03, MAP-01 narrowed; MATCH-V2-04/05, SCHED-V2-03, MAP-V2-01 added) and D-02 (MATCH-06 removed)*
