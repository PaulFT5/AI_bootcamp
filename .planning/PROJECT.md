# Erasmus@UPT

## What This Is

Erasmus@UPT is an English-first web assistant for incoming Erasmus+ exchange students (Studies and Traineeships, EU/EEA KA131 and Non-EU KA171) arriving at Politehnica University of Timișoara (UPT), Romania. It replaces scattered PDFs, Romanian-only maps, 10+ disconnected faculty timetable subdomains and informal WhatsApp groups with one unified tool covering a student's critical first weeks: choosing courses, completing paperwork, and building a personal timetable.

**Current scope (2026-11-21, D-17):** students hosted by the Faculty of Automation and Computers (AC) and AC courses only: the matcher, catalogue, Learning Agreement draft, schedule and map cover AC. The other faculties come later (REQUIREMENTS v2 "Other faculties"; ROADMAP "Deferred: other faculties").

## Core Value

An incoming student can enter their home-university courses and get ranked, explained UPT course matches (ECTS, semester, faculty, English status) they can put straight into their Learning Agreement.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Module 1 — AI Course Matcher (priority 1)**
- [ ] Ingest the AC file of UPT's official 2026-27 Erasmus Course Catalogue as the base course catalog (other faculties' files later)
- [ ] Enrich AC courses with their UPT syllabi (fișe disciplinei): topics for syllabus-to-syllabus matching
- [ ] Student enters home-university courses (name, description, ECTS) and gets ranked AC course matches with a score band, short AI reason, ECTS, semester, faculty, listed language
- [ ] Student can add matched courses to a saved Learning Agreement selection
- [ ] Student can upload a home-course syllabus (PDF or screenshot) and see possible AC matches
- [ ] Browse/filter the AC catalogue (semester, ECTS, has UPT syllabus; no English-only filter per D-02); LA draft CSV/print export

**Module 2 — Paperwork & Legal Assistant (priority 2)**
- [ ] 4-question onboarding: Citizenship (EU/EEA vs Non-EU), Grant (KA131 vs KA171), Mobility (Study vs Traineeship), Arrival Date
- [ ] Generates a personalized pre-arrival + Week 1 checklist with dependencies and deadlines (e.g., single-PDF email to incoming@upt.ro, Non-EU study visa steps, 3cm x 4cm ID photos, 600 RON cash dorm deposit vs card-only monthly rent, Rectorate Office 107 registration hours, Căminul 11C / after-hours key pickup at Căminul 8C)
- [ ] Student can tick off checklist items; progress persists

**Module 3 — Cross-Year Schedule Builder (priority 3)**
- [ ] Pick an AC course (e.g., OOP) from any study year/programme and see all its available slots on the weekly grid; combine into one personal schedule (pre-loaded AC timetable data; other faculties later)
- [ ] Detect time overlaps, handle odd/even week parity and week ranges
- [ ] Suggest conflict-free lab subgroups when multiple lab slots exist
- [ ] Decode UPT room codes (e.g., B417 → wing B, floor 4, room 17) with a Google Maps link to the building
- [ ] Export unified schedule as .ics calendar file

**Campus Map**
- [ ] Map of UPT points of interest (AC faculty buildings, dorms, UPT-owned/partner food & cafés, services); filter by category; select one for details + Google Maps link

**Platform**
- [ ] Own accounts (students have no UPT credentials on arrival) — matches, checklist and schedule saved per user
- [ ] Responsive web app, English-first

**Stretch (only if time remains before Sunday)**
- [ ] Grounded RAG chatbot over official UPT mobility guides, answering edge-case admin questions with exact citations

### Out of Scope

- Native / cross-platform mobile app — a colleague builds mobile later; this project is web only for now
- Mobile-specific API work before Sunday — the mobile app will later reuse this backend, so keep business logic behind a clean server/API boundary, but build no mobile endpoints, tokens or docs for the demo
- UPT SSO / Student UPT portal integration — students lack credentials before in-person registration
- Languages other than English — English-first is the point; Romanian translation not needed for v1
- AI timetable extractor (upload PDF/screenshot/text) — deferred to v2; v1 uses pre-loaded timetables
- Traineeship-specific checklist items, campus utilities info page — deferred to v2
- Non-UPT, non-partner businesses on the map — user wants only UPT-owned or partner places

## Context

- **Built for an AI bootcamp.** Demo deadline: **Sunday 2026-11-22** (project started Friday 2026-11-20 — ~2 days).
- User wants **all 3 modules fully working** at demo, built in priority order Matcher → Paperwork → Schedule. Timeline is extremely tight; phases must deliver demoable vertical slices so that whatever is done by Sunday works end-to-end.
- **Data sources are public URLs** on upt.ro: Erasmus Course Catalogue, faculty timetables (ac.upt.ro, etc.upt.ro, mec.upt.ro, and others), official mobility guides. Exact URLs to be confirmed with the user / located during research. Sources may be PDF or HTML and may be partly Romanian. For now only the AC sources are used (D-17); the others are kept as reference for later.
- Users are non-Romanian speakers; many source documents, maps and signs are in Romanian.
- Erasmus students take courses across faculties and study years via their Learning Agreements, so a single group timetable does not work for them.
- Greenfield repo (only `.claude/`, `.idea/`, `.impeccable/` present).

## Constraints

- **Timeline**: Demo-ready by Sunday 2026-11-22 — ruthless scope; seed/pre-processed data over live scraping at runtime
- **AI provider**: Claude API (matching rationale, PDF/screenshot timetable extraction via vision) — user has/can get an API key
- **Tech stack**: No bootcamp constraint — pick what ships fastest
- **Platform**: Web only (responsive) for now; a colleague's mobile app will later call this same backend
- **Database**: Plain Postgres + pgvector (`pgvector/pgvector:pg17`) in Docker via docker compose; development and the demo run on the laptop. User testing runs on Vercel + Neon (Postgres 17), reached by changing `DATABASE_URL`, then `CREATE EXTENSION vector` + `drizzle-kit push` + reseed
- **Catalogue access**: Current Erasmus catalogues sit in SharePoint folders that block automated fetch — the user downloaded the 2026-27 files in a browser (`data/raw/catalogue-2024-27/`). Only the AC file is imported for now (D-17); no 2021-22 fallback import (Phase 1 CONTEXT D-15)
- **Data accuracy**: Admin/legal checklist content must come from official UPT guides, not invented — wrong paperwork advice harms students

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Matcher = home course → UPT equivalent | Supports the Learning Agreement workflow, the students' real need | — Pending |
| Matcher output: ranked + score + AI reason + metadata | User's choice of what matters most | — Pending |
| Claude API for AI features | Strong at documents and vision for the schedule extractor | — Pending |
| Own accounts (not UPT SSO) | Students have no UPT credentials on arrival | — Pending |
| Web only now; mobile later shares backend | Colleague owns mobile; keep API boundary clean, no mobile work before Sunday | — Pending |
| Postgres + pgvector in Docker, demo on laptop | No cloud account, works offline, no network latency at demo; hosted Postgres later is a DATABASE_URL change | — Pending |
| User testing on Vercel + Neon (Postgres 17) | Testers need a public URL that works without the laptop; schema lives in code, so the move is `drizzle-kit push` + reseed | — Pending |
| Syllabus upload accepts PDF and screenshots (PNG/JPEG) | Students may only have a screenshot; Claude reads both. File-size errors shown before upload (Vercel ~4.5 MB body limit) | — Pending |
| RAG chatbot = stretch goal | User unsure it ships; build last | — Pending |
| Build order Matcher → Paperwork → Schedule | User's stated priority | — Pending |
| D-17 (2026-11-21): current scope is AC students and AC courses only; import only the AC catalogue file (204 rows), no faculty filter, one coordinator (AC's); other faculties moved to later, not deleted | User: "For now the implementation will work only for AC students." Smaller, demoable scope before Sunday; AC is the faculty with the syllabus (fișe) path | — Pending |

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
*Last updated: 2026-11-21 after the AC-only re-scope (D-17)*
