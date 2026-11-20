---
gsd_state_version: "1.0"
current_phase: 1
current_phase_name: Course Matcher
status: planning
stopped_at: Roadmap and state initialized; ready for `/gsd-plan-phase 1` (or `/gsd-discuss-phase 1`)
last_updated: "2026-11-20T23:00:30.263Z"
last_activity: 2026-11-20
last_activity_desc: Roadmap created (4 phases, 28/28 v1 requirements mapped)
state_head: b737fd7849248bc8dba872d48f82bb07bb6b4e13
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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Current 2024-27 catalogue needs a manual SharePoint download by the user. The fallback is the 2021-22 `.xls` snapshot, which needs a parse spike first
- [Phase 1]: Get the Voyage API key Friday. If it is missing by Saturday noon, use Plan B (Claude-only ranking)
- [Phase 1]: Confirm Claude model IDs, API key tier and spend cap on Friday
- [Phase 3]: UPT odd/even parity convention and Week 1 anchor are unverified. This is a gate before .ics export

### Roadmap Evolution

- Phase 1 edited: edited fields: goal, requirements, success_criteria, notes (2026-27 catalogue, AC syllabus matching, City Lines design)

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-11-20
Stopped at: Roadmap and state initialized; ready for `/gsd-plan-phase 1` (or `/gsd-discuss-phase 1`)
Resume file: None
