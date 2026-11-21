# Project Research Summary

> **Scope note:** Scope narrowed 2026-11-21 to AC only (D-17, `.planning/phases/01-course-matcher/01-CONTEXT.md`). Multi-faculty content below is reference for a later phase.

**Project:** Erasmus@UPT
**Domain:** English-first AI onboarding assistant for incoming Erasmus+ students at UPT Timișoara (course matcher for Learning Agreements, paperwork checklist, cross-faculty schedule builder with .ics export)
**Researched:** 2026-11-20
**Demo deadline:** Sunday 2026-11-22 (~2 days)
**Confidence:** MEDIUM overall (HIGH on stack/engineering patterns, MEDIUM on UPT data shapes, LOW on UPT parity convention until verified)

## Decisions Overriding Research (read first)

| Topic | Research said | Binding decision |
|-------|---------------|------------------|
| Database | STACK: Neon via Vercel Marketplace; STACK/PITFALLS warn against Docker/self-hosted Postgres | **Plain Postgres + pgvector in Docker** (`pgvector/pgvector:pg17`) via docker compose. Demo runs on the laptop. Neon is a later `DATABASE_URL` swap only. |
| Hosting | STACK: Vercel Hobby | **Demo = `next dev` / `next start` on laptop** against local Docker Postgres. No Vercel deploy required for Sunday. |
| Mobile | Out of scope | **Mobile app will later reuse this backend.** Keep business logic in pure `domain/` + `services/` behind thin route handlers. No mobile endpoints before Sunday. |
| Build order | Foundation → matcher → paperwork → schedule | Matcher → Paperwork → Schedule (user priority). RAG chatbot is stretch only. |
| Catalogue | STACK/FEATURES assumed a fetchable current catalogue | 2024-27 catalogues sit in SharePoint folders; **user must download manually**. Fallback: public 2021-22 `.xls` set (~2,700 rows, 23 files), labelled "snapshot 2021-22" in UI. |
| Auth | PITFALLS suggested Supabase/Clerk | Better Auth (email+password, library in-repo, no external service), per STACK. Hard 45-min time box; anonymous-cookie fallback. |

## Executive Summary

Erasmus@UPT is a decision tool for incoming exchange students: turn home-university courses into a valid UPT Learning Agreement, follow a personalised, source-cited arrival checklist, and build a cross-faculty timetable that does not silently clash once odd/even weeks are considered. Experts build this as a small full-stack app over curated reference data, with AI used for exactly two narrow jobs — ranking/explaining course matches and turning messy timetable documents into draft rows — while every fact students act on (ECTS, semester, English status, legal steps, deadlines) comes from data records and official sources, never from model output.

Recommended approach: one TypeScript repo — Next.js 16 (App Router) + React 19 + Tailwind/shadcn UI, Drizzle ORM on local Postgres 17 with pgvector, Better Auth, and `@anthropic-ai/sdk` with `messages.parse` + Zod schemas. The matcher is two-stage: Voyage `voyage-4` embeddings with pgvector top-20, then a single Claude call that reranks and writes reasons, with every returned course ID validated against the candidate set. All reference data (courses, embeddings, checklist rules, calendar, rooms) is produced by an offline ingest pipeline and committed as versioned seed files; runtime never scrapes upt.ro. Schedules are modelled as week-ranged, parity-aware activities expanded into explicit dated events in Europe/Bucharest — not RRULEs.

Key risks: (1) confident-but-wrong facts from the matcher or extractor, (2) a wrong parity convention or holiday calendar silently breaking conflict detection and .ics, (3) the 2-day timeline being eaten by ingestion and auth, (4) demo-day dependence on a live API key/network. Mitigations: ID-only LLM output, honest 3-value English status, a parity verification gate before schedule build, a hand-curated 20-course seed so the matcher works before ingestion finishes, cached demo results, and a fixed cut list that drops RAG first.

## Key Findings

### Recommended Stack

Single TypeScript stack on Node 24, one repo, `next dev`/`next start` on the laptop. Local Postgres via docker compose is the only infrastructure. Offline ingestion runs via `tsx`.

**Core technologies:**
- **Next.js 16.4 + React 19.3**: UI pages, Route Handlers, Server Actions — one process, clean API boundary for the future mobile client
- **@anthropic-ai/sdk 1.12 + Zod 4**: `client.messages.parse({ output_config: { format: zodOutputFormat(Schema) } })`; read `parsed_output` (null-guard). One schema = model contract + runtime validation
- **Claude models** (verify IDs at implementation): `claude-sonnet-5-5` for rerank and timetable extraction (via `CLAUDE_MODEL` env); `claude-opus-5-5` for offline ingest and extraction fallback
- **Postgres 17 + pgvector** (Docker image `pgvector/pgvector:pg17`): users, selections, checklist progress, schedules, courses + embeddings. `ORDER BY embedding <=> $1 LIMIT 20`
- **Drizzle ORM 0.45 + drizzle-kit 0.31** on `pg`: typed access; `drizzle-kit push` for schema
- **Better Auth 1.7** with `@better-auth/drizzle-adapter` and `nextCookies()`: email+password, no email verification
- **Voyage `voyage-4`** via plain `fetch` to `POST https://api.voyageai.com/v1/embeddings`: 1024 dims; `input_type` "document" at seed, "query" at match
- **Tailwind 4 + shadcn/ui + lucide-react + sonner**: fast UI
- **ical-generator 11** (or `ics`) for .ics export; **date-fns 4**; **vitest** for pure domain logic
- **cheerio, pdf-lib, tsx**: offline ingest only

**Claude API rules (HIGH):** never use forced `tool_choice`, `temperature`/`top_p`/`top_k`, prefill, or `thinking: {type:"disabled"}`. Use `output_config.effort` (matcher `low`, extractor `medium`). PDFs as `document` block before text; images as `image` blocks. Check `stop_reason === "refusal"`. Citations are incompatible with `output_config.format` — the stretch chatbot must use plain-text + citations.

**Rejected:** LangChain/LlamaIndex, Prisma, sqlite-vec, standalone vector DBs, local embedding models, pdf-parse/pdfjs/unpdf for catalogue/timetables, runtime scraping, LLM-generated checklists.

### Expected Features

**Module 1 — Course Matcher (priority 1)**

Must have (table stakes):
- Browse/filter all UPT courses (faculty, programme, year, semester, ECTS, English status)
- Multi-course home-course input form (name, description, ECTS, year)
- Ranked top matches per home course with score band (not raw %), 1-2 sentence reason, ECTS, semester, year, faculty, programme, English badges
- English status as the catalogue's three values ("taught in English" / "English materials" / "individual study in English possible", plus unknown) — never a boolean
- Semester filter (odd semester = autumn, even = spring)
- Saved Learning Agreement draft (home course ↔ UPT course, semester, ECTS) with running total and copy/print/CSV export — no OLA submission
- "Suggestions only — final approval by your faculty Erasmus coordinator" with per-faculty contacts

Differentiators: explained match with evidence; default-on "only English-taught" filter showing dropped count; matcher → scheduler auto-load (defer if needed).

**Module 2 — Paperwork & Legal Assistant (priority 2)**

Must have:
- 4-question onboarding (citizenship EU/EEA vs Non-EU, grant KA131 vs KA171, mobility study vs traineeship, arrival date)
- Hand-authored rules table (~25 items) → personalised checklist grouped pre-arrival / Week 1, with dependencies (blocked items greyed) and deadlines (arrival-relative, or fixed nomination deadlines: KA131 18 Jun / 10 Dec; KA171 30 Jun / 30 Nov)
- Every item shows source URL + quote + verified-on date
- Persisted tick-off progress
- Arrival facts: Residence 11C (Mon-Fri 08:00-16:00), key pickup at 8C after hours, Rectorate office 107 (Mon-Thu 12:00-15:30, Fri 11:00-13:00), 450 RON/month card-only rent, 600 RON cash deposit (refundable), two 3×4 cm photos, single-PDF email to incoming@upt.ro, 30-day LA change window, attendance 66% lectures / 100% labs
- Static utilities page (canteen, sports, library card desk, polyclinic) with source + as-of date
- "Informational only — verify with incoming@upt.ro" footer

**Module 3 — Cross-Year Schedule Builder (priority 3)**

Must have:
- Weekly grid combining courses across study years/faculties; day-list view for phones
- Parity-aware clash detection — opposite parity or disjoint week ranges do not clash
- Normalised `Activity` model with `weekFrom`, `weekTo`, `parity`
- Lab subgroup picker with clashing options greyed
- .ics export of selected schedule, holidays skipped, correct semester
- Room-code decoder for a few buildings from the official AC legend, explicit "not in our map yet" fallback

Should have / cut first: AI timetable extractor with review table (seed data first); subgroup backtracking suggestion (if cut, just show conflicts).

Defer (v2+): live upload as primary path, Romanian UI, coordinator views, trainee-specific flow, floor plans.

**Stretch — RAG chatbot:** grounded on official mobility guides with exact citations. Only after Module 3 is demoable; the ~3.5k-word studies page can be stuffed into a prompt.

**Anti-features (do not build):** live scraping, OLA auto-submit, "official equivalence" claims, UPT SSO, runtime LLM checklists, interactive maps, native mobile, reviews/social.

### Architecture Approach

Two worlds: an **offline side** (fetch → parse → normalise with Claude → Zod validate → review report → embed → frozen seed, all committed) and a **runtime side** (thin Next.js app reading seed files + local Postgres user tables). Reference data = repo files; user data = DB.

**Major components:**
1. **`domain/`** (pure, no IO) — Zod schemas (Course, Activity, ChecklistRule, Room), checklist evaluator (predicate + topo sort + deadlines), week expansion, `conflicts()`, subgroup solver, room parser, ICS building
2. **`services/`** (IO orchestration) — matcher (embed → top-K → rerank → ID validation → metadata join → cache), checklist (load rules → evaluate → merge progress), schedule (drafts → confirm → conflicts → ics). Route Handlers are thin wrappers — the same services serve the future mobile client
3. **`llm/`** — Claude + Voyage clients, prompts, schemas, timeout/retry, cache. No business rules
4. **`data/`** — memoised read-only loaders for seed files
5. **`db/`** — Drizzle schema + repos; every query scoped by `user_id`
6. **`scripts/ingest/`** — 01 fetch → 02 parse → 03 normalise → 04 validate + review report → 05 embed → 06 build-seed

**Key patterns:** (1) offline normalise → reviewed seed → runtime reads only, with provenance; (2) LLM chooses and explains, DB supplies facts; (3) declarative rules + pure evaluator, derive on read, store only completion; tests check no cycles and every rule sourced; (4) teaching-week table + occurrence expansion (Week 12 = Mon 2026-12-14, Week 13 = Mon 2027-01-11; vacation weeks absent); (5) extraction = draft → review → confirm (only Confirm writes, `reviewed=true`); (6) two-stage retrieval, never show raw cosine %; (7) room lookup as data with explicit fallback; (8) explicit dated events — one VEVENT per occurrence, stable UID.

### Critical Pitfalls

1. **LLM invents admin/legal advice** — hand-curated rules table, no LLM in the generation path; `source_url`, `source_quote`, `verified_on` mandatory per item; "informational only" notice; out-of-scope refusal for any chatbot.
2. **Matcher hallucinates metadata / embeddings match poorly** — LLM returns IDs, scores, reasons only; IDs validated against candidates; metadata from the record. Embed `title + faculty + description + level` after `normalize_ro`. Golden set of 10-15 known pairs, top-3 printed, before UI polish.
3. **Parity and holiday calendar wrong** — teaching-week table from the official calendar (verify the garbled PDF visually); `odd|even|every` + week range; explicit expansion, not RRULE `INTERVAL=2` (wrong across the winter break). Tests: no events on 2026-11-30, 2026-12-01, 2026-12-25; odd-week class appears only in odd teaching weeks; opposite-parity same-hour slots do not clash.
4. **.ics timezone/format bugs** — use a library; `DTSTART;TZID=Europe/Bucharest` + `VTIMEZONE`; stable UID; DTSTAMP; CRLF; 75-octet folding; UTF-8. Never build wall-clock dates with server local time. Import-test in Google and Apple Calendar.
5. **Ingestion and extraction eat the schedule** — time-box catalogue ingest (~3 h). Seed 3-4 real timetables first (AC past-semester Google Sheet CSV, MPT xlsx, SC xlsx, one MEC PDF). Extraction always goes through an editable review table; cache by file hash; "Try sample timetable" button.
6. **Romanian diacritics** — one `normalize_ro()` (NFC + map U+015F/U+0163/U+015E/U+0162 → U+0219/U+021B/U+0218/U+021A) at ingest and query time; explicit UTF-8 on every file read/write (Windows code-page risk).
7. **Scope and API demo risk** — hard time boxes per phase; cut list fixed up front; batched Claude calls with timeout + one retry; cache and pre-warm demo inputs; seeded demo account; screen recording as last resort.

See PITFALLS.md for the auth time sink (14), persistence (21), key tier/spend cap (11), and PII (25).

## Implications for Roadmap

Five phases (4 core + stretch). Every phase ends runnable on the laptop against local Postgres. Time boxes total ~16-20 h.

### Phase 0: Foundation and Data Spine (~3 h, Fri night → Sat morning)
**Rationale:** every module needs shared schemas, DB, Claude client and seed loader; diacritics and calendar are cheap now, expensive later.
**Delivers:** Next.js 16 TS scaffold with Tailwind + shadcn; `docker-compose.yml` with `pgvector/pgvector:pg17`; `.env.local` (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000`) with `.gitignore` covering env files; `domain/schema.ts`; `normalize_ro()` with tests; Drizzle schema (`vector(1024)` + user tables), `CREATE EXTENSION vector` verified; Better Auth email+password (45-min box; anonymous fallback); `llm/claude.ts` wrapper (`messages.parse`, `effort`, refusal check, timeout, one retry); hand-written 20-course `courses.json`; `calendar.json` draft; checklist content authoring starts as a human task; unit tests for normalise, teaching-week table, parity expansion.
**Avoids:** pitfalls 6, 14, 21, 25, 26.

### Phase 1: Matcher Slice — Module 1 (~5-6 h, Fri night → Sat afternoon)
**Rationale:** user priority 1; produces the LA draft the schedule later consumes; can start on 20 hand-written courses before ingestion finishes.
**Delivers:** multi-course input → Voyage query embedding → pgvector top-20 → Claude rerank (`effort: low`) → top-5 with score band, reason, validated IDs, DB-joined metadata, English badges; course browser with filters and English-only toggle with dropped count; LA draft with ECTS total, CSV and print; coordinator disclaimer. Catalogue ingest (~3 h box): 23 `.xls` files from 2021-22; header-regex column detection; forward-fill merged programme cells; split bilingual `EN - RO`; integer ECTS/semester; keep the three English columns separate; review report for unknowns. Golden set of 10-15 pairs, top-3 printed after every change. Cache by normalised-input hash in `match_cache`.
**Fallback:** if no Voyage key by Saturday noon → Plan B: prompt-cached compact catalogue ranked by Claude alone. Note ~2,700 rows (~150-200k tokens) is larger than STACK's example; fits context but slower/costlier, so Plan B stays a fallback.
**Avoids:** pitfalls 2, 3, 4, 17 (delimit home-course text), 18, 22, 23.

### Phase 2: Paperwork Slice — Module 2 (~3 h, Sat afternoon)
**Rationale:** no AI dependency; mostly content; parallelisable; exit criterion is content accuracy, not code.
**Delivers:** 4-question onboarding; `checklist-rules.json` (~25 items) with `when`, `dependsOn`, date-only deadline anchor, `sourceUrl`, `sourceQuote`, `verifiedOn`; pure evaluator returning todo/blocked/overdue/done; tests for all 8 persona combinations, date edges, cycle lint; grouped checklist UI with persisted ticks; footer with verified date and contacts; static utilities page with source + as-of date.
**Avoids:** pitfalls 1, 15 (record `academic_year`, `fetched_on`), 20, 21.

### Phase 3: Schedule Slice — Module 3 (~5-6 h, Sat evening → Sun morning)
**Rationale:** highest technical risk; internal ordering keeps each step demoable.
**Delivers (in order):**
- 3a: `calendar.json` for S1 and S2 2026-27 (verified visually); `Activity` model (`semesterId`, `weekFrom`, `weekTo`, `parity`, `group`, `subgroup`, `room`); 2-3 seed timetables; pure parity- and range-aware `conflicts()`; weekly grid with odd/even toggle + mobile day list
- 3b: .ics from explicit occurrences, `DTSTART;TZID=Europe/Bucharest` + `VTIMEZONE`, stable UIDs, holidays skipped; import-test in Google + Apple; tests across the 2026-12-14 → 2027-01-11 boundary
- 3c: subgroup picker with clashes greyed; optional backtracking suggestion (cut first)
- 3d: room decoder from the official AC legend with unknown fallback
- 3e (optional): Claude extractor (`document` for PDF, `image` for screenshots) → draft rows with confidence + snippet → editable review table → only Confirm persists; offline pre-extraction powers "Try sample timetable"
**Verification gate before 3b:** confirm parity convention and Week 1 anchor against one real legend (AC legend, or MPT `p = even / i = odd`) and the calendar. Keep the anchor as a config constant.
**Avoids:** pitfalls 5, 7, 8, 9, 10, 16, 19, 24.

### Phase 4: Demo Readiness (~2-3 h, Sunday morning)
**Delivers:** one-command `docker compose up` + `next build && next start`; `/api/health` (DB reachable, key present, no secret leak); seeded demo account with LA, checklist progress and schedule; "Load demo data" button; pre-run matcher demo inputs to warm the cache; demo mode serving cached results on API failure; key tier and spend cap checked Friday; demo script with 2-3 known-good courses, one persona (non-EU, KA171, study, spring), one timetable; three rehearsals from a clean profile; 60-90 s screen recording; code freeze ~noon Sunday.
**Avoids:** pitfalls 11, 12, 13.

### Stretch: RAG Chatbot (only if Phases 0-4 are green)
Chunk official mobility guide pages offline → retrieve top passages with the same Voyage + pgvector stack → plain-text answer (not structured output) citing passage IDs; refuse below a similarity threshold and point to incoming@upt.ro. Ground-test with 5 out-of-scope questions that must be refused.

### Phase Ordering Rationale

- Foundation first: shared schemas, DB, Claude client, calendar — every module depends on them.
- Matcher before Paperwork and Schedule: user priority; only module with an LA deliverable; tunable quality gets the earliest golden-set gate.
- Paperwork before Schedule: no AI dependency, parallelisable, gives a demoable slice Saturday afternoon while schedule risk is worked on.
- Schedule last among core: highest technical risk and most time-sensitive; its internal ordering keeps it demoable.
- Matcher → scheduler link is optional and off the critical path (join by name + year; manual fallback).
- Each phase ends runnable on the laptop — vertical slices, so whatever is done by Sunday works end-to-end.

### Research Flags

Need deeper research / verification spike during planning:
- **Phase 1 (catalogue ingest):** 2021-22 `.xls` has hazards (merged cells, shifting language column, bilingual strings, no faculty column) → 30-min parse spike before task planning. 2024-27 format unknown until downloaded.
- **Phase 3 (parity + calendar):** UPT parity convention (week 1 = odd? numbering across winter break?) unverified; Senate calendar PDF text garbled → visual check of calendar and one real legend before 3b. Faculties may differ.
- **Phase 3 (extraction, if included):** MEC and CT PDFs show no visible parity markers → one-sample spike per faculty.

Standard patterns (skip research-phase):
- **Phase 0:** official docs for Next.js, Drizzle + pgvector, Better Auth, docker pg17.
- **Phase 2:** rules table + pure evaluator; the work is content review.
- **Phase 3 .ics and interval overlap:** library + standard logic; only unknown is the data convention.
- **Phase 4:** operational checklist.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm versions verified 2026-11-20; local smoke tests on Node 24 (`zodOutputFormat`, `drizzleAdapter`, `ical-generator`). Claude API rules from official reference. Voyage params HIGH; free tier/price MEDIUM. Model IDs to confirm at implementation. Vercel claims no longer apply. |
| Features | MEDIUM-HIGH | Paperwork facts from the official 2026-27 studies page (HIGH). Catalogue structure measured on the 2021-22 set (HIGH). 2024-27 catalogue and AC 2026-27 timetable not verified (SharePoint). Canteen data from 2023 guide (LOW). |
| Architecture | HIGH patterns / MEDIUM UPT semantics | Patterns well established. Parity rule, room floor rule and calendar dates inferred from one or two documents; flagged as open items. |
| Pitfalls | MEDIUM overall | Engineering pitfalls HIGH. UPT-specific parity, holidays and file shapes MEDIUM/LOW until verified. |

**Overall confidence:** MEDIUM — stack and engineering approach solid enough to start Friday night; data-dependent parts need the verifications in the phases that depend on them.

### Conflicts Resolved

- **Parity/.ics:** STACK's floating-time workaround vs ARCHITECTURE/PITFALLS `TZID` + `VTIMEZONE` → explicit occurrences with TZID + VTIMEZONE, verified by import; floating workaround only if import fails.
- **Structured output:** PITFALLS "tool use or JSON schema" vs STACK forbidding forced `tool_choice` → `messages.parse` + `zodOutputFormat` only.
- **Rerank model:** Haiku-class (ARCHITECTURE/PITFALLS) vs Sonnet (STACK) → Sonnet via `CLAUDE_MODEL`; switch tier only if golden set or latency demands it.
- **Retrieval:** Voyage + pgvector (STACK) vs prompt-cached catalogue below ~400 courses (ARCHITECTURE) → Voyage + pgvector, since the catalogue (~2,700 rows) exceeds that threshold and local Postgres removes the infra objection; Plan B is the fallback.
- **Auth:** Supabase/Clerk/Firebase (PITFALLS) vs Better Auth (STACK) → Better Auth.

### Gaps to Address

- **2024-27 catalogue not fetchable:** user downloads SharePoint files in a browser (action item, first). Start on 2021-22, labelled "snapshot 2021-22"; re-ingest later.
- **Voyage key and free tier:** obtain Friday; Plan B if missing by Saturday noon.
- **Claude model IDs and key tier:** IDs from the API reference cached 2026-11-03 — confirm; check tier and spend cap Friday.
- **UPT parity convention and Week 1 anchor:** visual check of calendar PDF and one real legend before 3b; anchor as config constant.
- **Calendar dates:** from garbled Senate PDF text; verify visually; confirm holidays inside teaching weeks (demo-relevant: 30 Nov, 1 Dec, 25 Dec 2026).
- **Demo semester:** today is teaching week 8 of S1; spring students use S2 (starts 2027-03-01). Seed both; label academic year in UI.
- **Room codes:** only the AC legend is official; floor rule confirmed only for the N building. Explicit table with fallback; never infer.
- **Checklist facts:** official page is HIGH, but some items (Erasmus+ App checklist, visa details) were not fully read. Every rule needs sourceUrl + quote; unsourced items omitted.
- **Canteen hours/prices:** 2023 guide only — label "as of 2023 guide" or omit.
- **Insurance vs polyclinic:** page does not say whether insured Erasmus students get free care — do not promise it.
- **Timetable coverage:** AC 2026-27 on SharePoint; past-semester Google Sheet CSVs fetchable; MEC/CT lack visible parity markers. Demo on 2-3 faculties with pre-extracted seed; MEC only if parity check passes.
- **Matcher quality:** untested until the golden set runs; gate before UI polish.

## Sources

### Primary (HIGH confidence)
- Claude API reference (cached 2026-11-03) — models, `messages.parse`, effort, PDF/image blocks, refusal, citations constraint
- npm registry + local smoke tests on Node 24.19 (2026-11-20)
- docs.voyageai.com embeddings — `voyage-4`, 1024 dims, `input_type`
- better-auth.com Next.js + Drizzle docs
- international.upt.ro studies-2026-2027 page (fetched 2026-11-20) — dorm, registration, deadlines, coordinators
- international.upt.ro course-catalogue-2021-2024 page + 23 linked `.xls` files (parsed with SheetJS)
- upt.ro calendar-timetables page; Senate decision no. 26/19.03.2026 (text garbled)
- Anthropic embeddings guidance; Unicode Standard (Romanian comma-below vs cedilla); RFC 5545; EU DST rules

### Secondary (MEDIUM confidence)
- AC Google Sheet legend tab + past-semester CSV
- MEC, CT, ETcTI, MPT, SC timetable files (fetched, text-extracted)
- 2025-26 KA131/KA171 factsheets (referenced)
- Erasmus+ App and OLA descriptions (search results)
- AI course-equivalence preprints; schedule-builder analogues (Michigan, Cornell, Calgary)
- MEC 2025-26 timetable cell formats

### Tertiary (LOW confidence)
- SharePoint catalogue and AC 2026-27 timetable (not fetchable)
- 2023 canteen data
- Voyage free tier/price (search excerpts)
- Vercel limits (no longer relevant)
- Non-AC parity conventions (unverified)

---
*Research completed: 2026-11-20*
*Ready for roadmap: yes (binding decisions applied; open verifications tracked as gaps)*
