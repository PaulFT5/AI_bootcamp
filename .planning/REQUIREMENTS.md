# Requirements: Erasmus@UPT

**Defined:** 2026-11-20
**Core Value:** An incoming student can enter their home-university courses and get ranked, explained UPT course matches (ECTS, semester, faculty, English status) they can put straight into their Learning Agreement.

## v1 Requirements

Requirements for the Sunday 2026-11-22 demo. Each maps to roadmap phases. Details will be re-discussed per phase during implementation (user: "discuss all the details again while implementing").

### Platform

- [ ] **PLAT-01**: User can create an account with email and password and stay logged in across browser sessions
- [ ] **PLAT-02**: User's Learning Agreement draft, checklist progress and schedule are saved to their account and restored on next login

### Course Matcher

- [ ] **MATCH-01**: The UPT course catalogue is available in the app, ingested from the official Erasmus Course Catalogue (current year if the user downloads it, otherwise the public 2021-22 snapshot, labelled as such in the UI)
- [ ] **MATCH-02**: User can enter one or more home-university courses (name, description, ECTS, study year) and get the top UPT matches for each, ranked with a score band and a 1-2 sentence reason
- [ ] **MATCH-03**: Each match shows ECTS, semester, study year, faculty, programme and English status (taught in English / English materials / individual study in English / unknown) taken from catalogue data, never from model output
- [ ] **MATCH-04**: User can upload a home-course syllabus PDF; the course name, description, ECTS and topics are extracted and pre-filled for the user to review, then matched (format reference: UPT "fișa disciplinei" examples; one course per PDF)
- [ ] **MATCH-05**: User can browse the full UPT catalogue and filter by faculty, semester, ECTS and English status
- [ ] **MATCH-06**: An "English-taught only" filter is on by default and shows how many courses it hides
- [ ] **MATCH-07**: User can add matched UPT courses to a Learning Agreement draft that shows the running ECTS total
- [ ] **MATCH-08**: User can export the Learning Agreement draft as CSV and as a printable view
- [ ] **MATCH-09**: Match results show that suggestions are not official equivalences and that final approval is by the faculty Erasmus coordinator, with that coordinator's contact

### Paperwork & Legal

- [ ] **PAPER-01**: User answers 4 onboarding questions: citizenship (EU/EEA vs Non-EU), grant (KA131 vs KA171), mobility type (Study vs Traineeship), arrival date
- [ ] **PAPER-02**: User sees a personalised checklist grouped into pre-arrival and Week 1, containing only items that apply to their answers
- [ ] **PAPER-03**: Each item shows its deadline (relative to arrival date, or fixed such as nomination deadlines) and overdue items are flagged
- [ ] **PAPER-04**: Items that depend on other items stay blocked until their prerequisites are ticked
- [ ] **PAPER-05**: Each item shows its official UPT source link, the quoted source text and the date it was verified (content is hand-curated from official guides, never LLM-generated)
- [ ] **PAPER-06**: User can tick items as done and their progress persists

### Schedule Builder

- [ ] **SCHED-01**: Real UPT timetable data for at least 2-3 faculties (e.g., AC, MPT/SC, MEC) is pre-loaded into the app
- [ ] **SCHED-02**: User can pick a UPT course from any faculty or study year (e.g., "OOP") and see all its available slots (lecture, lab, seminar options) on the weekly grid
- [ ] **SCHED-03**: User can select slots to build one personal schedule combining courses from different faculties and study years
- [ ] **SCHED-04**: Overlapping slots are detected and highlighted, taking odd/even weeks and week ranges (e.g., weeks 1-7) into account
- [ ] **SCHED-05**: User can switch the grid between odd-week and even-week views
- [ ] **SCHED-06**: When a course has multiple lab/seminar subgroups, the app suggests a conflict-free subgroup choice
- [ ] **SCHED-07**: Each class shows decoded room details (e.g., B417 → wing B, floor 4, room 17) with a Google Maps link to the building; unknown codes show a "not in our map yet" fallback
- [ ] **SCHED-08**: User can export their schedule as an .ics file whose events land on the correct dates and times (Europe/Bucharest, odd/even weeks respected, holidays and vacation skipped)

### Campus Map

- [ ] **MAP-01**: User sees a campus map with UPT points of interest: faculty buildings, dorms, UPT-owned or partner food & cafés, and services (library card desk, student clinic, sports complex, International Relations Office)
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
| MATCH-06 | Phase 1 | Pending |
| MATCH-07 | Phase 1 | Pending |
| MATCH-08 | Phase 1 | Pending |
| MATCH-09 | Phase 1 | Pending |
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
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-20*
*Last updated: 2026-11-20 after roadmap creation (traceability filled)*
