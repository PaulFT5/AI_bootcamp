# Erasmus@UPT

## What This Is

Erasmus@UPT is an English-first web assistant for incoming Erasmus+ exchange students (Studies and Traineeships, EU/EEA KA131 and Non-EU KA171) arriving at Politehnica University of Timișoara (UPT), Romania. It replaces scattered PDFs, Romanian-only maps, 10+ disconnected faculty timetable subdomains and informal WhatsApp groups with one unified tool covering a student's critical first weeks: choosing courses, completing paperwork, and building a personal timetable.

## Core Value

An incoming student can enter their home-university courses and get ranked, explained UPT course matches (ECTS, semester, faculty, English status) they can put straight into their Learning Agreement.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Module 1 — AI Course Matcher (priority 1)**
- [ ] Ingest UPT's official Erasmus Course Catalogue (public URL) as the base course catalog
- [ ] Enrich courses with metadata from official UPT faculty pages / study plans: ECTS, semester, study year, host faculty, evaluation type, English status (fully taught in English vs. English tutoring/materials)
- [ ] Student enters home-university courses (name, description, ECTS) and gets ranked UPT equivalents with similarity score, short AI reason, ECTS, semester, faculty, English status
- [ ] Student can add matched courses to a saved Learning Agreement selection

**Module 2 — Paperwork & Legal Assistant (priority 2)**
- [ ] 4-question onboarding: Citizenship (EU/EEA vs Non-EU), Grant (KA131 vs KA171), Mobility (Study vs Traineeship), Arrival Date
- [ ] Generates a personalized pre-arrival + Week 1 checklist with dependencies and deadlines (e.g., single-PDF email to incoming@upt.ro, Non-EU study visa steps, 3cm x 4cm ID photos, 600 RON cash dorm deposit vs card-only monthly rent, Rectorate Office 107 registration hours, Căminul 11C / after-hours key pickup at Căminul 8C)
- [ ] Student can tick off checklist items; progress persists
- [ ] Campus utilities info: cafeterias, sports complexes, library access card desk, student clinic

**Module 3 — Cross-Year Schedule Builder (priority 3)**
- [ ] Combine courses from different study years and faculties into one personal schedule using structured timetable data
- [ ] AI schedule extractor: upload PDF, screenshot or pasted text from faculty timetable portals (ac.upt.ro, etc.upt.ro, mec.upt.ro) → parsed courses, labs, seminars
- [ ] Detect time overlaps, handle odd/even week parity
- [ ] Suggest conflict-free lab subgroups when multiple lab slots exist
- [ ] Translate UPT room codes (e.g., B410 in the Electro complex) into building/wing/floor directions
- [ ] Export unified schedule as .ics calendar file

**Platform**
- [ ] Own accounts (students have no UPT credentials on arrival) — matches, checklist and schedule saved per user
- [ ] Responsive web app, English-first

**Stretch (only if time remains before Sunday)**
- [ ] Grounded RAG chatbot over official UPT mobility guides, answering edge-case admin questions with exact citations

### Out of Scope

- Native / cross-platform mobile app — a colleague builds mobile separately; this project is web only
- Shared backend API for mobile — mobile app is independent; no API contract work for it
- UPT SSO / Student UPT portal integration — students lack credentials before in-person registration
- Languages other than English — English-first is the point; Romanian translation not needed for v1

## Context

- **Built for an AI bootcamp.** Demo deadline: **Sunday 2026-11-22** (project started Friday 2026-11-20 — ~2 days).
- User wants **all 3 modules fully working** at demo, built in priority order Matcher → Paperwork → Schedule. Timeline is extremely tight; phases must deliver demoable vertical slices so that whatever is done by Sunday works end-to-end.
- **Data sources are public URLs** on upt.ro: Erasmus Course Catalogue, faculty timetables (ac.upt.ro, etc.upt.ro, mec.upt.ro, and others), official mobility guides. Exact URLs to be confirmed with the user / located during research. Sources may be PDF or HTML and may be partly Romanian.
- Users are non-Romanian speakers; many source documents, maps and signs are in Romanian.
- Erasmus students take courses across faculties and study years via their Learning Agreements, so a single group timetable does not work for them.
- Greenfield repo (only `.claude/`, `.idea/`, `.impeccable/` present).

## Constraints

- **Timeline**: Demo-ready by Sunday 2026-11-22 — ruthless scope; seed/pre-processed data over live scraping at runtime
- **AI provider**: Claude API (matching rationale, PDF/screenshot timetable extraction via vision) — user has/can get an API key
- **Tech stack**: No bootcamp constraint — pick what ships fastest
- **Platform**: Web only (responsive); mobile handled by a colleague separately
- **Data accuracy**: Admin/legal checklist content must come from official UPT guides, not invented — wrong paperwork advice harms students

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Matcher = home course → UPT equivalent | Supports the Learning Agreement workflow, the students' real need | — Pending |
| Matcher output: ranked + score + AI reason + metadata | User's choice of what matters most | — Pending |
| Claude API for AI features | Strong at documents and vision for the schedule extractor | — Pending |
| Own accounts (not UPT SSO) | Students have no UPT credentials on arrival | — Pending |
| Web only; mobile separate | Colleague owns mobile; focus for the 2-day deadline | — Pending |
| RAG chatbot = stretch goal | User unsure it ships; build last | — Pending |
| Build order Matcher → Paperwork → Schedule | User's stated priority | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-20 after initialization*
