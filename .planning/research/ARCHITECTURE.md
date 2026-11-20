# Architecture Research

**Domain:** AI-assisted student-onboarding web app (semantic course matcher + rule-based checklist + timetable extraction/conflict detection/.ics) for incoming Erasmus+ students at UPT Timisoara
**Researched:** 2026-11-20
**Confidence:** HIGH on structural patterns; MEDIUM on UPT-specific data semantics (parity rule, room codes, catalogue format) - flagged inline and in "Open Verification Items"

## Grounding Evidence (read before trusting the rest)

Two real UPT documents were actually fetched and text-extracted (`pdftotext -layout`) while researching. Three findings below change the design and are not guesses:

1. **UPT academic calendar 2026-2027** (Senate decision no. 26 / 19.03.2026, https://media.upt.ro/ - PDF, Romanian only). Text layer is garbled by overlapping columns, so dates were reconstructed; **verify against the original before shipping**.
   - Semester I: teaching 28.09.2026-18.12.2026 (12 wk), **vacation 21.12.2026-10.01.2027 (3 wk)**, teaching 11.01.2027-22.01.2027 (2 wk), exam session 25.01-19.02.2027, break 22.02-28.02.2027.
   - Semester II (years I-III): starts 01.03.2027; teaching 01.03-23.04.2027 (8 wk), vacation 26.04-02.05.2027 (1 wk, Orthodox Easter week), teaching 04.05-11.06.2027 (6 wk), session 14.06-11.07.2027.
   - So each semester = **14 teaching weeks with a vacation hole in the middle**. Demo day (2026-11-22) is in teaching week 8 of Semester I; an incoming Spring student's schedule is Semester II (starts 01.03.2027). The `.ics` demo must pick a semester explicitly.
2. **Real faculty timetable (MEC, "Mecatronica si Robotica anul IV, sem 1 2025-2026")** is a day x hour-block grid with one column per formation/subgroup (`MCTR/1, MCTR/2, ROB/1, ROB/2`). Verbatim cells: `PSM (L) 311 impar`, `PSM (L) 311 par`, `AP (L) sapt. 8-14`, `MIC (L) 308 sapt. 1-7`, `MIC(P) 308 sapt. 8-14`, `ADE sapt. 1-10 (C) lab. Optica`, `Management (S) sala N111`. A legend at the bottom maps abbreviations (`PSM`, `AP`...) to full course names and teachers. Consequences:
   - Parity is `impar`/`par` text **and** activities carry **week ranges** (`sapt. 1-7`, `sapt. 8-14`). Data model needs `weekFrom/weekTo` AND `parity`, not just a parity flag.
   - Two activities in the same slot that look conflicting (`MIC (L) sapt. 1-7` vs `MIC (P) sapt. 8-14`) are legal. A naive time-only overlap check produces false conflicts.
   - Room codes are non-uniform: `311`, `N111`, `225D SPM`, `sala 309`, `lab. Optica`, `lab CNC`. The "letter+floor digit+number" assumption (e.g. `B410`) is **not** universal; room lookup must be an explicit table with a graceful "unknown room" fallback.
   - Cells wrap mid-token (`sapt. 8-\n14`), group is implied by column position, activity type is in parentheses `(C)/(L)/(S)/(P)`. Text-layer extraction loses column attribution; send the PDF/image to Claude (layout-aware) rather than regex over `pdftotext`.
3. **Parity vs RRULE trap (arithmetic from the calendar above).** If parity = teaching-week-number % 2 (assumed, see verification items), Dec 14 is week 12 (even) and Jan 11 is week 13 (odd). A naive `RRULE:FREQ=WEEKLY;INTERVAL=2` from week 1 crosses the 3-week vacation and lands on **even** weeks afterwards (calendar-week arithmetic flips). RRULE-based parity is therefore wrong across the winter break. Decision: **emit explicit dated events**, expanded from a teaching-week table.

Other sources: Anthropic docs state Anthropic offers no embedding model and recommends Voyage AI (`input_type="document"|"query"`) - check the current model table at https://platform.claude.com/docs/en/build-with-claude/embeddings before picking a model name.

## Standard Architecture

### System Overview

Two worlds with a hard wall between them: an **offline build-time pipeline** (developer machine, slow, LLM-heavy, human-reviewed) that produces **versioned seed files**, and a **thin runtime app** that never touches upt.ro.

```
 OFFLINE (developer runs, output committed to git)           RUNTIME (deployed web app)
┌────────────────────────────────────────────────┐   ┌──────────────────────────────────────────┐
│ scripts/ingest                                  │   │ UI (responsive, English)                  │
│  01 fetch  ->  data/raw/ (cached PDFs/HTML)      │   │  /match   /checklist   /schedule  /chat?  │
│  02 parse  ->  data/work/*.parsed.json           │   └───────┬──────────┬──────────┬────────────┘
│  03 normalize/enrich (Claude, JSON-schema out)   │           │          │          │
│  04 validate (zod) + REVIEW REPORT (human gate)  │   ┌───────▼──────────▼──────────▼────────────┐
│  05 embed (Voyage)                               │   │ API layer (route handlers, zod-validated) │
│  06 build-seed                                   │   └───────┬──────────┬──────────┬────────────┘
│        │                                         │           │          │          │
│        ▼                                         │   ┌───────▼───┐ ┌────▼─────┐ ┌──▼───────────┐
│  data/seed/  (READ-ONLY reference data)          │   │ matcher   │ │ checklist│ │ schedule     │
│   courses.json + embeddings.f32                  │   │ service   │ │ engine   │ │ service      │
│   checklist-rules.json                           │   │ (embed ->  │ │ (pure fn)│ │ (extract,    │
│   calendar.json   rooms.json                     │   │ topK->LLM │ │          │ │ overlap, ics)│
│   timetables/*.json (pre-extracted safety net)   │   │ rerank)   │ │          │ │              │
└───────────────────────┬────────────────────────┘   └─────┬─────┘ └────┬─────┘ └──┬───────────┘
                        │ loaded at boot (in-memory)        │            │          │
                        └──────────────────────────────────►│◄───────────┴──────────┘
                                                            │
                                  ┌─────────────────────────▼──────────────┐   ┌─────────────────┐
                                  │ llm/ (Claude client, Voyage client,     │──►│ Claude API       │
                                  │  prompts, schemas, retry, cache)        │   │ Voyage embeddings│
                                  └─────────────────────────┬──────────────┘   └─────────────────┘
                                                            │
                                  ┌─────────────────────────▼──────────────┐
                                  │ User-data DB + auth (users, profile,    │
                                  │ la_selection, checklist_progress,       │
                                  │ schedule_entry, match_cache)            │
                                  └────────────────────────────────────────┘
```

Rule of thumb that keeps this small: **reference data = files in the repo; user data = database.** No vector DB, no CMS, no search server. The catalogue is hundreds of rows, not millions.

### Component Responsibilities / Boundaries

| Component | Owns | Talks to | Must NOT |
|-----------|------|----------|----------|
| `scripts/ingest` (offline) | fetch/parse/normalize/embed; provenance; review report | upt.ro, Claude, Voyage; writes `data/seed/` | run at request time; write to user DB |
| `data/seed/*` | Courses, embeddings, rules, calendar, rooms, sample timetables | read by runtime loaders only | be edited by the app |
| `domain/` (pure TS, no IO) | checklist evaluation, week expansion, overlap, subgroup solver, room parse, ICS building | called by services/tests | import SDKs, DB, `fetch` |
| `llm/` | Claude + Voyage clients, prompts, output schemas, retry/timeout, response cache | external APIs | contain business rules |
| matcher service | query embed, cosine topK, rerank call, join metadata, cache | `llm/`, seed courses, DB (`match_cache`, `la_selection`) | let the LLM supply ECTS/semester/faculty |
| checklist service | load profile -> evaluate rules -> merge progress | `domain/checklist`, DB (`profile`, `checklist_progress`) | call an LLM |
| schedule service | extraction jobs (draft), confirm, overlap, ics, room lookup | `llm/`, `domain/schedule`, DB (`schedule_entry`), seed (calendar, rooms) | persist unreviewed AI output as confirmed |
| auth + user DB | accounts, per-user rows | everything user-scoped | store reference data |
| UI | forms, review table, week grid, download | API only | contain rule logic |

### Recommended Project Structure

Single TypeScript monolith (e.g. Next.js App Router) so one set of `zod` schemas serves ingestion validation, LLM structured output, API contracts and UI. (Framework choice itself belongs to STACK.md; this structure is framework-agnostic.)

```
src/
├── app/                    # routes + UI: match/, checklist/, schedule/, api/*
├── domain/                 # PURE, unit-tested, no IO
│   ├── schema.ts           # zod: Course, Activity, ChecklistRule, Room, Calendar (single source of truth)
│   ├── checklist/          # evaluate.ts (predicate + deps + deadlines), toposort.ts
│   ├── schedule/           # weeks.ts (expandWeeks), overlap.ts, solve.ts (subgroups), ics.ts, rooms.ts
│   └── match/              # cosine.ts, join.ts (attach metadata, ECTS delta)
├── services/               # orchestration: matcher.ts, checklist.ts, schedule.ts, extract.ts
├── llm/                    # claude.ts, voyage.ts, prompts/, cache.ts
├── data/                   # loaders: loadSeed() memoized at module scope
└── db/                     # user-data schema + repos
scripts/ingest/             # 01-fetch.ts ... 06-build-seed.ts, review-report.ts
data/raw/                   # cached source files (commit small ones; reproducibility)
data/work/                  # intermediate step outputs (gitignored)
data/seed/                  # committed, reviewed, read-only at runtime
```

**Rationale:** `domain/` being pure is the single most valuable decision under a 2-day deadline: checklist, overlap and ICS are testable in seconds with no mocks, and they are exactly where wrong output harms students.

## Architectural Patterns

### Pattern 1: Offline normalize -> reviewed seed -> runtime reads only

**What:** Every slow/uncertain step (fetch, PDF parse, LLM enrichment, embedding) happens in a resumable script pipeline. Each step reads the previous step's file and writes its own, so a failure at step 3 never re-fetches. Output is validated by zod and carries provenance (`sourceUrl`, `fetchedAt`, `model`, `confidence`, `reviewed: boolean`).
**When:** Always here - "seed data over live scraping" is a project constraint, and upt.ro PDFs are Romanian/inconsistent.
**Trade-offs:** + deterministic demo, no upt.ro outage risk, reviewable diff in git. - data goes stale (acceptable; ship `generatedAt` in the UI footer).

```
01 fetch      curl -> data/raw/<sha>.pdf              (skip if hash unchanged)
02 parse      pdf/html -> raw rows/text per course    (pdftotext / cheerio; do not trust ordering)
03 normalize  Claude(JSON schema) per course -> Course (title_en, ects, semester, level, faculty,
              evalType, englishStatus: 'full'|'tutoring'|'unknown', summary_en for embedding, confidence)
04 validate   zod + review-report.md (rows with unknown/low-confidence/missing ECTS, sorted)  <- HUMAN GATE
05 embed      Voyage(document) over `title + summary_en` -> embeddings.f32 (Float32, row order = courses.json)
06 build-seed freeze data/seed/*
```

`englishStatus: 'unknown'` is a first-class value shown honestly in the UI. Never let the LLM guess it to look complete (PROJECT.md accuracy constraint).

### Pattern 2: "LLM chooses and explains; the database supplies facts"

**What:** In the matcher the model only receives candidate IDs and returns `{courseId, score, reason}`. Server code validates every `courseId` is in the candidate set, then joins ECTS/semester/faculty/English status from `courses.json`. ECTS delta (home vs UPT) is computed in code.
**When:** Any time output ends up in a Learning Agreement.
**Trade-offs:** + zero hallucinated courses/credits. - slightly more plumbing (trivial).

```typescript
const RerankOut = z.object({ matches: z.array(z.object({
  courseId: z.string(), score: z.number().int().min(0).max(100), reason: z.string().max(220),
})).max(5) });
const out = RerankOut.parse(await claudeJson(prompt, RerankOut));
const result = out.matches
  .filter(m => candidateIds.has(m.courseId))                 // drop hallucinations
  .map(m => ({ ...m, ...courseById[m.courseId], ectsDelta: courseById[m.courseId].ects - home.ects }));
```

### Pattern 3: Declarative rule data + pure evaluator (checklist)

**What:** Checklist content is JSON authored from official UPT guides, each item carrying a predicate, dependencies, a deadline anchor and a **source citation**. A pure function evaluates `(profile, rules, today) -> ordered items`. Only completion state is persisted; the list is **derived on every read**, so fixing a rule fixes every user.
**When:** Accuracy-critical content (visa steps, deposit amounts, office hours). No LLM at runtime.
**Trade-offs:** + auditable, testable across all 2x2x2 profile combinations x dates. - content authoring is the bottleneck, not code (start it in parallel on day 1).

```typescript
type Rule = {
  id: string; title: string; phase: 'pre-arrival' | 'week1';
  when?: Pred;                                   // omit = applies to everyone
  dependsOn?: string[];
  deadline?: { anchor: 'arrival' | 'mobilityStart'; offsetDays: number } | { date: string };
  detail: string; sourceUrl: string; lastVerified: string;   // citation is mandatory
};
type Pred = { all: Pred[] } | { any: Pred[] } | { not: Pred }
          | { field: 'citizenship' | 'grant' | 'mobility'; eq: string };
// evaluate(): filter by `when` -> topo-sort by dependsOn (cycle = throw at load/test) ->
// resolve deadline vs arrivalDate -> status = done | blocked(deps open) | overdue | todo
```
A 15-line predicate interpreter beats pulling in `json-logic`; a load-time test asserts no cycles, no dangling `dependsOn`, every rule has `sourceUrl`.

### Pattern 4: Teaching-week table + occurrence expansion (the schedule core)

**What:** `calendar.json` lists teaching weeks explicitly: `[{ n: 1, monday: "2026-09-28" }, ... { n: 12, monday: "2026-12-14" }, { n: 13, monday: "2027-01-11" }, { n: 14, monday: "2027-01-18" }]`. An activity is a recurring pattern over **teaching-week numbers**; both overlap detection and `.ics` are derived from the same expansion. Vacation weeks simply do not exist in the table.
**When:** Always; this is what makes week ranges (`sapt. 8-14`), parity and holidays correct at once.

```typescript
type Activity = {
  id: string; courseName: string; courseId?: string;      // courseId = optional link to catalogue
  type: 'course' | 'lab' | 'seminar' | 'project';
  day: 1|2|3|4|5|6|7; start: string; end: string;        // "HH:MM" local Europe/Bucharest
  parity: 'all' | 'odd' | 'even';
  weekFrom: number; weekTo: number;                       // teaching-week numbers, default 1..14
  semesterId: string;                                     // "2026-27-S1"
  group?: string; subgroup?: string;                      // formation e.g. "MCTR", subgroup "1"
  room?: string; teacher?: string; faculty?: string; yearOfStudy?: number;
  source: { kind: 'seed' | 'ai' | 'manual'; ref?: string; confidence?: number; reviewed: boolean };
};

const weeksOf = (a: Activity) => range(a.weekFrom, a.weekTo)
  .filter(w => a.parity === 'all' || (a.parity === 'odd') === (w % 2 === 1));

export const conflicts = (a: Activity, b: Activity) =>
  a.semesterId === b.semesterId && a.day === b.day &&
  a.start < b.end && b.start < a.end &&                   // "HH:MM" strings compare correctly
  weeksOf(a).some(w => weeksOf(b).includes(w));           // exact; MIC(L) 1-7 vs MIC(P) 8-14 => no conflict
```

### Pattern 5: Extraction as draft -> human review -> confirm

**What:** Claude (PDF/image/text input) returns `Activity[]` drafts with per-row `confidence` and `sourceSnippet`; server zod-validates and normalizes (time format, activity type letter -> enum, room cleanup); UI shows an editable table with low-confidence rows highlighted and a live conflict panel; only **Confirm** writes `schedule_entry` rows with `reviewed=true`.
**When:** Any AI output a student will rely on.
**Key mechanics:**
- Send the **PDF natively** (or image), not `pdftotext` output - column/group attribution depends on layout.
- Faculty PDFs are large and contain every group. Ask the user for **year/program/formation (or the course names)** and instruct the model to return only matching rows; otherwise token cost and omission errors grow. Optionally split by page and run pages in parallel.
- Prompt carries a small Romanian glossary: `C=curs->course, L=laborator->lab, S=seminar, P=proiect->project, impar=odd, par=even, sapt.=weeks, sala=room, lab.=laboratory`, and instructs: resolve abbreviations via the legend; default `weekFrom=1,weekTo=14` when absent; output `null` rather than guessing.
- Use tool-use / JSON-schema structured output; on zod failure retry once with the error message, then surface "could not parse row N" instead of silently dropping.
- **One extractor, two uses:** the same `extract()` runs offline to produce `data/seed/timetables/*.json` (demo safety net + sample button) and at runtime for uploads.

### Pattern 6: Two-stage retrieval for matching

**What:** Stage 1 cheap/deterministic (embedding cosine over precomputed vectors, optional metadata filters); stage 2 smart (Claude rerank with explanation over ~20 candidates).
**Why:** 2-4 s end-to-end and cents per query, and the visible "reason" is the product's differentiator.

```
home course {name, description, ects}
  -> embed query (Voyage, input_type="query")                        ~150-300 ms
  -> brute-force cosine over N x D Float32Array in memory (N<~2k)   <5 ms, no vector DB
  -> topK=20 (filter by semester / englishStatus if user chose)
  -> Claude rerank: candidates {id,title,summary,ects} + home course -> top5 {id,score,reason}   ~1.5-3 s
  -> join metadata, ectsDelta -> cache by sha256(normalized home course) in match_cache
```
- Run multiple home courses in parallel (`Promise.all`), and render each card as it resolves.
- Use a small/fast Claude tier for rerank and a stronger tier for vision extraction; confirm model IDs at implementation time (`claude-api` skill) - do not hardcode from memory.
- Do not display raw cosine as "similarity %". Show the LLM score bucketed (strong/partial/weak) with the reason; cosine is only a retrieval tool.
- **Decision rule:** if the final catalogue is <= ~400 courses, an alternative with no second vendor is to put the compact catalogue (`id|title|ects|summary`, ~30k tokens) in a prompt-cached system block and skip embeddings entirely. Prefer embeddings if the catalogue is larger or you want the RAG stretch to reuse the same infra (it does).

### Pattern 7: Room lookup as data, parser as hint

`rooms.json` = ordered list of `{ pattern: regex|exact, building, complex, wing?, floor?, directions, mapUrl? }`; first match wins; no match -> show raw code + "Location not in our map yet" (never invent). Exact-code entries override pattern rules. Seed it by hand for the ~15 rooms the demo timetables actually use; extend by LLM-assisted drafting from the UPT campus map PDF in the offline pipeline, human-reviewed. A parser like `/^([A-Z])(\d)(\d{2})$/` -> building letter / floor / room is a plausible default for codes like `B410` but is **MEDIUM-LOW confidence** and the real MEC timetable already shows `311`, `N111`, `225D SPM`, `lab. Optica`.

### Pattern 8: Explicit-date `.ics` in UTC

Each occurrence = `weeks -> monday + (day-1)` at local time `Europe/Bucharest`, converted to UTC **per occurrence** (Luxon/`Intl`/Temporal), emitted as its own `VEVENT` with stable `UID = ${activity.id}-${yyyymmdd}@erasmus-upt`. Consequences: no RRULE parity bug across the vacation (see Grounding #3), no `VTIMEZONE` block, and DST is correct (EU DST ends 2026-10-25 and starts 2027-03-28; a single UTC `DTSTART` + RRULE would drift one hour after the change). ~14 events/activity is fine for Google/Apple/Outlook. Use a library (`ics` or `ical-generator`) for line folding/escaping rather than hand-rolling. Put room + building directions in `LOCATION`/`DESCRIPTION`. If you ever need RRULE, it is only safe within a contiguous teaching block with `EXDATE` for gaps; not worth it here.

## Data Flow

### Request Flows

```
MATCH      home course form -> POST /api/match -> matcher service
             -> cache hit? return
             -> Voyage embed -> cosine topK -> Claude rerank (zod) -> join seed metadata -> cache -> cards
           "Add to LA" -> POST /api/la -> la_selection(user_id, home_json, upt_course_id, score, reason)

CHECKLIST  onboarding (4 answers) -> PUT /api/profile -> profile row
           GET /api/checklist -> load profile + seed rules + checklist_progress
             -> domain.evaluate(profile, rules, today) -> ordered items (status, due) -> UI
           tick item -> PUT /api/checklist/:id -> checklist_progress(user_id, item_id, done_at)

SCHEDULE   upload/paste + (program, year, formation) -> POST /api/extract -> Claude (document/image block)
             -> zod-validate -> normalize -> DRAFT Activity[] (+confidence, snippet) -> review UI
           edit/confirm -> POST /api/schedule -> schedule_entry(reviewed=true)
           GET /api/schedule -> entries -> domain.conflicts -> week grid (odd/even toggle) + room directions
           GET /api/schedule.ics -> expandOccurrences(entries, calendar) -> ics lib -> text/calendar
           "Suggest subgroups" -> domain.solve (backtracking over alternative lab slots)
```

### State Management

- Server is source of truth for user data; client holds only drafts (extraction review table) in component state until Confirm.
- Derived, never stored: checklist list, conflict set, `.ics`, room directions.
- Stored: profile, checklist completion, LA selection, confirmed schedule entries, match cache.

### Key Data Flows

1. **Provenance flow:** upt.ro doc -> raw -> normalized Course (with `sourceUrl`) -> UI "source" link; checklist rule `sourceUrl` -> UI citation. Every factual claim in the app is traceable.
2. **Cross-module links (all optional, add only after each slice works):** LA selection -> schedule (prefill "courses I need timetables for"); `courseId` on `Activity` links timetable rows to catalogue courses via fuzzy name match done in the offline pipeline; `profile.arrivalDate` -> semester default (Sep arrival = S1, Feb arrival = S2).

## Subgroup Suggestion (small CSP)

For each (course, type) the user must attend with several alternative `Activity` options (different subgroups/slots), choose one per group such that no pair conflicts per `conflicts()`, minimizing "hours on campus gaps" as a tiebreak. Instance size is ~5-8 groups x 2-6 options, so plain backtracking is instantaneous; no solver library. Return the first K solutions plus "no conflict-free option; least-bad pick conflicts with X" when infeasible (do not claim success).

## Build Order (vertical slice per module)

Dependencies: schema + LLM client -> everything; `calendar.json` -> schedule only; embeddings infra -> matcher then RAG; checklist has **no** AI dependency (can be built in parallel by a second person or after matcher stalls).

**Phase 0 - Skeleton (about 2-3 h, Fri evening).** Repo, `domain/schema.ts`, auth, user-DB schema, `llm/claude.ts` (JSON-schema helper, retry, timeout), seed loader, deploy target, shared layout. Hand-write a **20-course `courses.json`** so Phase 1 is never blocked by ingestion. In parallel (30-min spike): run one real timetable PDF through Claude and read the raw output - this de-risks Phase 3 early.

**Phase 1 - Matcher slice (Fri night - Sat morning).**
1a. Match with the 20 hand courses end-to-end: form -> embed (or prompt-cached catalogue) -> rerank -> cards -> Add to LA -> saved LA page. *Demoable.*
1b. Ingestion pipeline on the real Erasmus Course Catalogue: fetch -> parse -> normalize -> review-report -> embed -> swap seed. Time-box hard (about 3 h); fallback = catalogue subset (top faculties) still passing review.
1c. Cache + parallel multi-course + loading/stream UX.

**Phase 2 - Paperwork slice (Sat midday - afternoon).**
2a. Author `checklist-rules.json` from the official guides (start this at Phase 0 as a human task; every rule has `sourceUrl`). 2b. `domain/checklist` + table-driven tests for all 8 profile combos + date edge cases + dependency-cycle lint. 2c. 4-question onboarding, grouped checklist (pre-arrival / Week 1) with due dates and blocked state, persisted ticks, static campus-utilities page (data file). *Demoable.* Content accuracy review is the exit criterion, not UI polish.

**Phase 3 - Schedule slice (Sat evening - Sun morning), in this internal order so each step is demoable.**
3a. `calendar.json` (teaching weeks, verified against the Senate PDF) + `Activity` model + **manual/seed entry** + `conflicts()` + week grid with odd/even toggle (seed from 2-3 pre-extracted timetables). *Works with zero AI.*
3b. `.ics` export (explicit dates, UTC) - verify by importing into Google Calendar; assert Dec 14 -> Jan 11 weeks.
3c. AI extractor + review UI feeding the same draft shape; run it offline over the demo PDFs to create `seed/timetables/` and a "Try sample" button (live-demo insurance).
3d. `rooms.json` + directions in grid/ICS.
3e. Subgroup suggestion (cut first if late).

**Phase 4 - Stretch RAG (only Sun morning if all else green).** Chunk the official mobility guides in the existing offline pipeline, embed with the same Voyage client, in-memory cosine, Claude answers with chunk-ID citations rendered as links; refuse if no chunk passes a similarity threshold. Reuses Phase 1 infra, adds ~half a day of risk; cut without regret.

**Cut order if time runs out:** RAG -> subgroup suggestion -> room lookup polish -> cross-module links -> multi-course parallel UX. Never cut: review step in extraction, source citations in checklist, metadata-from-DB in matcher.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Bootcamp demo / 0-1k users | Monolith, seed files in memory, one small DB. Cache rerank results. Nothing else. |
| 1k-10k users (a real semester intake is a few hundred) | Rate-limit AI endpoints per user; move `match_cache` and extraction jobs to a queue if timeouts bite; load seed once per instance. |
| 100k+ | Not applicable for UPT Erasmus intake; would add pgvector, background extraction workers, admin UI for rules. |

### Scaling Priorities

1. **First bottleneck:** Claude latency/rate limits and per-user cost on extraction (large PDFs). Fix: per-user quota, page-range/formation filter, cache extraction by file hash, process pages in parallel.
2. **Second bottleneck:** demo-day concurrency from a shared API key. Fix: warm caches for scripted demo inputs; sample-data fallback buttons.

## Anti-Patterns

### Anti-Pattern 1: LLM-generated checklist
**What people do:** Ask Claude "what must a non-EU KA171 student do" at runtime or per user.
**Why it's wrong:** Plausible-but-wrong visa/deposit advice harms students; not auditable.
**Do this instead:** Declarative rules with `sourceUrl`; LLM may only help *draft* rules offline, human-reviewed.

### Anti-Pattern 2: Runtime scraping / live upt.ro fetch
**What people do:** Fetch the catalogue or timetables on demand.
**Why it's wrong:** Slow, brittle (PDF layouts change), demo dies if the site is down or Romanian-only content shifts.
**Do this instead:** Offline pipeline -> committed seed; show `generatedAt`.

### Anti-Pattern 3: Letting the LLM return facts (ECTS, semester, English status)
**What people do:** Trust the model's JSON for course metadata at match time.
**Why it's wrong:** Hallucinated credits in a Learning Agreement.
**Do this instead:** Pattern 2 - IDs from the model, facts from the DB.

### Anti-Pattern 4: Parity as a boolean, or RRULE INTERVAL=2 for parity
**What people do:** `isOdd: boolean` plus `RRULE:FREQ=WEEKLY;INTERVAL=2`.
**Why it's wrong:** Loses week ranges (`sapt. 1-7`), false conflicts, wrong weeks after the winter/Easter vacation, DST drift.
**Do this instead:** Pattern 4 + Pattern 8 (teaching-week table, explicit UTC events).

### Anti-Pattern 5: Saving extraction output directly
**What people do:** Parse PDF -> write to DB.
**Why it's wrong:** Timetable cells are ambiguous (wrapped text, merged cells, implied columns); silent errors give students wrong class times.
**Do this instead:** Draft -> confidence-highlighted review table -> confirm; `reviewed` flag on every row.

### Anti-Pattern 6: One giant extraction call over a whole-faculty PDF
**What people do:** Upload everything, ask for everything.
**Why it's wrong:** Cost, latency, truncated output, missed rows.
**Do this instead:** Scope by program/year/formation (or course names) and/or page; validate row count.

### Anti-Pattern 7: Vector DB / framework for a few hundred rows
**What people do:** pgvector/Pinecone/LangChain on day 1.
**Why it's wrong:** Hours lost on infra for zero demo value.
**Do this instead:** Float32 file + 10-line cosine; reconsider only if RAG chunks exceed ~50k.

### Anti-Pattern 8: Persisting the derived checklist
**What people do:** Store the generated list per user.
**Why it's wrong:** Rule corrections never reach existing users; deadlines go stale if arrival date changes.
**Do this instead:** Store profile + completion only; derive on read.

### Anti-Pattern 9: Building ingestion before a slice exists
**What people do:** Spend Friday night perfecting the full catalogue parse.
**Why it's wrong:** Nothing demoable by Saturday if the PDF fights back.
**Do this instead:** 20 hand-written courses first, widen data second (Phase 1a before 1b).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude API | Server-side only; JSON-schema/tool output; PDF `document` block + image block; retry-once-on-validation-fail; hard timeout | Key never in client. Prompt-inject surface: uploaded PDFs and home-course text are untrusted data - no tools, schema-validated output, render as text. |
| Voyage AI embeddings | Offline batch for catalogue; one call per query at runtime | Second API key and vendor (Anthropic has no embedding model). Fallback: prompt-cached full catalogue (Pattern 6 decision rule). Don't mix embedding models between corpus and queries. |
| upt.ro / faculty subdomains | Offline fetch only | Mixed PDF/HTML, Romanian; cache raw files; record source URL + fetch date. |
| Calendar clients | `.ics` download (`text/calendar`, `Content-Disposition: attachment`) | Test import in Google Calendar and Apple Calendar. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI <-> API | JSON over route handlers, zod-validated both sides | Shared schemas from `domain/schema.ts`. |
| services <-> `domain/` | Direct function calls | `domain/` stays pure; services do IO. |
| services <-> `llm/` | Typed functions (`rerank`, `extractActivities`) | Prompts/schemas live in `llm/`; swap model tier in one place. |
| runtime <-> seed data | Read-only memoized loaders | No runtime writes; update = regenerate + redeploy. |
| matcher <-> schedule | Optional `courseId` link only | No hard dependency; keeps slices independently shippable. |

## Open Verification Items (resolve before/while building)

1. **Parity rule** (MEDIUM): confirm `impar/par` = teaching-week number parity (week 1 = odd) and that numbering continues across the Christmas break (weeks 12 -> 13). Ask one faculty secretary/student, or check a timetable note. The model supports either via the explicit week table (`parity` can be precomputed per week), so a wrong guess is a data change, not a rewrite.
2. **Calendar dates** (MEDIUM): re-read the Senate PDF visually (text layer was garbled); also confirm Romanian public holidays falling in teaching weeks (1 Dec, Easter week handled by vacation).
3. **Erasmus course catalogue format/URL** (unknown): not inspected; pipeline step 02 is the only part that depends on it.
4. **Room-code conventions per faculty** (LOW-MEDIUM): inventory codes in the demo timetables before designing `rooms.json` patterns.
5. **Which semester the demo targets**: today is teaching week 8 of S1; Spring-arriving incoming students use S2 (starts 2027-03-01). Seed both in `calendar.json`.
6. **Per-faculty timetable variants**: only MEC format verified; AC/ETcTI/etc. may differ (some publish HTML). Run the extractor on one sample from each of 2-3 faculties in the Phase 0 spike.

## Sources

- UPT academic calendar page (links to Senate decision and per-faculty timetable pages: ac.upt.ro/orare/, etc.upt.ro/avizier/orar, mec.upt.ro/orare-2/, ...): https://www.upt.ro/en/students/calendar-timetables - HIGH (official)
- UPT Senate decision no. 26/19.03.2026, structure of academic year 2026-2027 (PDF on media.upt.ro, text extracted locally; digits partly garbled) - MEDIUM pending visual verification
- UPT MEC timetable "Orar Mecatronica si Robotica anul IV Sem.1 2025-2026" (https://mec.upt.ro/wp-content/uploads/2025/10/IV_MCTR_ROB_21_09_2025_Sem1_V1.pdf), text-extracted locally - HIGH for format observations of this faculty, unknown for others
- Anthropic embeddings guidance (no first-party embeddings; Voyage recommended): https://platform.claude.com/docs/en/build-with-claude/embeddings - HIGH on the claim, model names to be re-checked
- Standard retrieve-then-rerank, derived-state, and explicit-occurrence calendar patterns - general engineering knowledge, MEDIUM-HIGH

---
*Architecture research for: Erasmus@UPT (course matcher, checklist, timetable builder)*
*Researched: 2026-11-20*
