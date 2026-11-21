---
gsd_state_version: "1.0"
current_phase: 1
current_phase_name: Course Matcher
status: planning
stopped_at: Phase 1 context gathered
last_updated: "2026-11-20T23:14:02.687Z"
last_activity: 2026-11-20
last_activity_desc: Roadmap created (4 phases, 28/28 v1 requirements mapped)
state_head: 35ead669bd7e0433f019fd3263d558cef77eb7db
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-20)

**Core value:** An incoming student can enter their home-university courses and get ranked, explained UPT course matches (ECTS, semester, faculty, English status) they can put straight into their Learning Agreement.
**Current focus:** Phase 1 — Course Matcher

## Current Position

Phase: 1 of 4 (Course Matcher)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-11-20 — Roadmap created (4 phases, 28/28 v1 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Foundation (scaffold, Docker Postgres+pgvector, Better Auth, Claude client) is folded into Phase 1 so Phase 1 ends with a demoable matcher
- [Roadmap]: PLAT-02 (account-wide restore) is mapped to Phase 3, the first phase where LA draft, checklist and schedule all exist. Phases 1-2 persist their own data per user
- [Roadmap]: Campus Map is its own last phase, reuses Phase 3 building records, and is the first cut if time runs out
- [Research]: Binding overrides in research/SUMMARY.md "Decisions Overriding Research" (local Docker DB, laptop demo, manual SharePoint catalogue download)
- [Phase 1 D-17, 2026-11-21, user-approved]: Current scope is AC students and AC courses only. Import only the AC catalogue file (204 rows, 84 Bachelor + 120 Master); Matcher, catalogue and LA know only AC courses; no faculty filter; one coordinator (AC's). Other faculties (CT, ET, ARH, IH, MEC, RIA; ETC, Chemistry, MPT, Communication Sciences) moved to v2, not deleted; raw files stay in `data/raw/catalogue-2024-27/`. Supersedes D-15, narrows D-16
- [Phase 1 D-12 clarified, 2026-11-21, user-approved]: An LA course's Winter/Summer placement always comes from its catalogue semester and cannot be changed by the user
- [Phase 1 D-02]: MATCH-06 (English-taught-only filter) removed; REQUIREMENTS and ROADMAP updated 2026-11-21
- [Phase 1 planning]: Matching is one Claude call over the prompt-cached AC catalogue (no Voyage key, no shortlist stage at 204 rows)

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: AC fișe disciplinei need a manual browser download from the ac.upt.ro programme pages (SharePoint folders); without them success criterion 3 is waived (the app still works, "Compared by catalogue entry")
- [Phase 1]: Confirm Claude model IDs, API key tier and spend cap on Friday
- [Phase 3]: UPT odd/even parity convention and Week 1 anchor are unverified. This is a gate before .ics export

### Roadmap Evolution

- Phase 1 edited: edited fields: goal, requirements, success_criteria, notes (2026-27 catalogue, AC syllabus matching, City Lines design)
- 2026-11-21: Scope narrowed to AC only (D-17): Phase 1 goal, criteria 2/3/5 and notes; Phase 3 and 4 narrowed to AC timetables and buildings; "Deferred: other faculties" section added; MATCH-06 removed from the Phase 1 requirements line (D-02)

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Scope | Other faculties: CT, ET, ARH, IH, MEC, RIA catalogues (files downloaded, not imported) and ETC, Chemistry, MPT, Communication Sciences (files never found); their timetables, buildings, coordinators and fișe (MATCH-V2-03/04/05, SCHED-V2-03, MAP-V2-01) | Deferred (D-17) | 2026-11-21 | v2 |

## Session Continuity

Last session: 2026-11-20T23:14:02.662Z
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-course-matcher/01-CONTEXT.md
