# Phase 1: Course Matcher - Research

> **Scope note:** Scope narrowed 2026-11-21 to AC only (D-17, `.planning/phases/01-course-matcher/01-CONTEXT.md`). Multi-faculty content below is reference for a later phase.

**Researched:** 2026-11-21
**Domain:** Next.js 16 + Drizzle/Postgres + Better Auth foundation; XLSX/XLSB catalogue import; Claude-based course matching (structured output, PDF/image extraction, prompt caching); LA draft export
**Confidence:** MEDIUM-HIGH (HIGH on catalogue shapes, which were measured on the real files; MEDIUM on AC fișe collection, which cannot be automated; MEDIUM on Claude call details, which could not be smoke-tested because no API key is in this environment)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Every course in the 2026-27 Erasmus catalogue files counts as open to Erasmus students in English, whatever its language column says. Do not treat Romanian/French/German/blank rows as unavailable. Reversibility: costly.
- **D-02:** Drop the "English-taught only" filter and its hidden-count (MATCH-06 removed). The planner must update REQUIREMENTS.md and the ROADMAP Phase 1 success criterion 5 to match. The roadmap question "AC Master = English?" is moot.
- **D-03:** Still import and store the language exactly as written in the file (plus the "English materials", "individual study in English" and "recommended for international students" columns where present). Show it as plain info on the course, labelled e.g. "Listed language: Romanian" (blank -> nothing shown). Never used as a filter or for ranking. Still satisfies MATCH-03.
- **D-04:** Optional semester filter on the Matcher: Winter / Summer / Any (default Any). Odd catalogue semesters = Winter, even = Summer. Study year is shown on each match but never filters.
- **D-05:** Top 3 matches per home course, with "Show more" revealing up to 5. Fetch 5 in one call. Golden-set gate checks top-3.
- **D-06:** Score bands Strong / Partial / Weak, derived from Claude's numeric score (thresholds are Claude's discretion). No percentages in the UI. Weak matches shown greyed.
- **D-07:** Only the course name is required. Description/topics, ECTS and study year optional, with a hint that a description improves matches. Upload (MATCH-04) pre-fills the same form.
- **D-08:** Matching runs per course as soon as it is added or edited. Each course loads independently; one slow call does not block others. Changing the semester filter re-runs matching (cache by normalised input hash + filter).
- **D-09:** Home courses and their last match results are saved to the user's account; after re-login the Matcher looks the same. User can re-run matching on request.
- **D-10:** Sign-in comes first: the whole app requires an account. No anonymous mode, no anonymous-to-account migration. (Anonymous-cookie fallback only if Better Auth exceeds its 45-min time box.)
- **D-11:** Each LA row may link to the home course it replaces. Rows added from the Matcher are linked automatically. Rows added from the catalogue show "No home course" and can be linked later. Several UPT courses may link to one home course.
- **D-12:** ECTS uses two meters, Winter and Summer, each against a target of 30, with the prototype's under/at/over messages. Mobility length is not asked.
- **D-13:** CSV columns: Semester, UPT code, UPT course, Faculty, Programme, Study year, ECTS, Matched home course, Home course ECTS.
- **D-14:** Printable view header: student name (from account), home university (asked once, stored on profile), date. Below: table, suggestions-only disclaimer, coordinator contact for each faculty in the draft. Printing uses the browser print dialog (print CSS), not PDF generation.
- **D-15:** Missing faculties (ETC, Chemistry, MPT, Communication Sciences): one catalogue line "Not yet included: ETC, Chemistry, MPT, Communication Sciences. Ask incoming@upt.ro." No 2021-22 fallback import.
- **D-16:** Coordinator contacts hand-curated into a seed JSON, one entry per faculty (coordinator name, email, source URL, date checked), from https://international.upt.ro/en/contact/. If a faculty has no listed coordinator, show incoming@upt.ro. The catalogue files' embedded faculty contact person is for cross-check only.
- Import notes: find the header row as the first row containing "Course unit". MEC and RIA Licenta have a junk row above the header. IH Master has a "Supliment diploma" row under the header; skip rows with no course name or no code. RIA Licenta has blank rows after the header. Contact text embedded in MEC Faculty cells must not be imported as programme/faculty.

### Claude's Discretion
- Thresholds that map the numeric score to Strong/Partial/Weak.
- Exact wording of hints, empty states and the "Listed language" label.
- Where the home-university field is first asked (sign-up vs first print).

### Deferred Ideas (OUT OF SCOPE)
- Importing missing faculties (ETC, Chemistry, MPT, Communication Sciences) when their 2026-27 files are found.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | Email+password account, stays logged in across browser sessions | Better Auth wiring (Standard Stack, Pattern 1); persistent-cookie check goes in UAT |
| MATCH-01 | 2026-27 catalogue imported, labelled with source year | Catalogue Import section: measured column map, 1,327 importable rows, hazards |
| MATCH-02 | Enter home courses, get ranked top matches with band + reason | Matching pipeline (Pattern 3), Claude call shapes, score bands |
| MATCH-03 | ECTS/semester/year/faculty/programme/language from catalogue data, never model output | Facts joined from DB by validated ID (Pattern 3, Pitfall 8) |
| MATCH-04 | Upload PDF/screenshot, pre-fill, review, match | Extraction call shape (Code Examples), size limits, client downscale |
| MATCH-05 | Browse + filter catalogue (faculty, semester, ECTS, language, has-syllabus) | Schema columns + indexed filters; language is a filter field here, only the "English-only" default is removed |
| MATCH-06 | **SUPERSEDED by D-02. Record as removed**: not implemented; REQUIREMENTS.md + ROADMAP criterion 5 must be edited | Planner task: doc edit (see Open Question 4 for traceability wording) |
| MATCH-07 | Add matched courses to LA draft with running ECTS total | LA tables, parity-based Winter/Summer meters |
| MATCH-08 | LA panel opens full draft; CSV + printable view | CSV function + print CSS (Don't Hand-Roll, Pitfall 14) |
| MATCH-09 | Suggestions-only notice + coordinator contact | Coordinator table found (Open Question 2: D-16's source URL does not contain it) |
| MATCH-10 | AC fișe collected offline with manifest, paired by code | AC fișe hosting finding: SharePoint-in-WordPress, manual download, pairing algorithm |
| MATCH-11 | Evidence label + covered/missing topics for AC courses with syllabus | Two-stage pipeline; label derived in code from `hasSyllabus`, not from the model |
</phase_requirements>

## Summary

The catalogue import is tractable but has more hazards than the roadmap lists. Reading all 7 files with SheetJS (including the `.xlsb`) works and yields **1,327 importable rows** (roadmap said 1,329: two rows have a name but no code and are skipped by D rule). The columns differ per file and must be found by header regex anchored at the start of the header text. Course `code` is **not unique** (102 codes repeat across programmes, e.g. language electives `L200.24.01.C7` x3), so the catalogue needs a surrogate row id. The Faculty column is unusable (it contains contact text, programme names and blanks); faculty must come from the file name. One sheet (Power Engineering Master) has three columns all headed "Year of study" that are really year, semester and ECTS by position.

The biggest schedule risk is the AC fișe (MATCH-10/11). They are **not fetchable by script**: each AC programme page on ac.upt.ro embeds a "Fișele disciplinelor" folder through a WordPress OneDrive/SharePoint plugin that loads its listing dynamically, and there are no static PDF links (I confirmed this on the 10 AC programme pages that cover the catalogue). I did not call the plugin's ajax endpoint (blocked as unauthorised access). The user must download the folders in a browser, like the catalogue. The sample UPT fișă I could read (from another UPT faculty, same template) has no catalogue-code field, so pairing by code depends on the file names. The plan must treat syllabus-to-syllabus as an optional data layer: the matcher has to work, and be demoable, with zero fișe collected.

Matching: the whole catalogue serialised compactly is about 45k tokens (about 70k with keywords), so **Plan B (Claude over a prompt-cached catalogue) is clearly feasible and is the lowest-moving-parts option**. No Voyage or Anthropic API key is present in this environment and the Docker daemon is not running, so Plan B plus an early environment check is the prudent default. Use two stages: (1) shortlist ~10 IDs over the cached catalogue, (2) rank/explain the shortlist with full entries and, for AC rows with a syllabus, extracted topics. The model returns only IDs, scores, reasons and covered/missing topics; every fact and the evidence label come from the database.

**Primary recommendation:** Build Plan B behind a `Shortlister` interface, derive faculty from file names, give catalogue rows a surrogate id, make AC syllabus data an optional enrichment fed by a user-downloaded folder, and start the Docker daemon and confirm `ANTHROPIC_API_KEY` first (neither is available in the research environment).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Account sign-up / sign-in / session | API / Backend (Better Auth route handler) | Frontend Server (`proxy.ts` optimistic redirect) | Credentials and sessions are server-owned; proxy only checks cookie presence |
| Authorization of every data route | API / Backend (`requireUser()` in each handler/service) | — | Proxy cookie check is explicitly "not secure"; real check must be in the data layer |
| Catalogue import (XLSX/XLSB -> rows) | Offline script (`scripts/`) | Database (seed) | No runtime parsing; committed/seeded data only |
| AC fișe collection + topic extraction | Offline script + manual browser download | Database (`syllabus` table) | Hosting blocks automation; Claude reads PDF offline |
| Catalogue browse + filter | API / Backend (SQL filters) | Browser (filter UI state) | 1.3k rows: server query with indexed columns; client holds filter state |
| Match shortlist + rank + explain | API / Backend (`services/matcher`) | `llm/claude` wrapper | Secrets and prompt live server-side; IDs validated in code |
| Syllabus/screenshot extraction | API / Backend (route handler -> Claude) | Browser (downscale image, size check before upload) | Browser rejects oversize and downscales; server re-validates type/size |
| Score band, evidence label, ECTS meters | `domain/` pure functions | Browser (render) | Pure + unit-tested; reused by the future mobile app |
| LA draft persistence | Database (user-scoped tables) | API / Backend | Must survive logout/login |
| CSV export | API / Backend (route handler) | — | One server function, one `Content-Disposition` response |
| Printable view | Frontend Server (page) + print CSS | Browser print dialog | D-14: no PDF generation |
| Match-result cache | Database (`match_cache`) | — | Demo safety when the API is slow |

## Standard Stack

### Core
All versions: `[VERIFIED: npm registry]` via `npm view <pkg> version` on 2026-11-21 (match STACK.md); packages are long-established first-party/ecosystem libraries, not slopsquat candidates (see Package Legitimacy Audit).

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.6 | App Router, route handlers, `proxy.ts` | Fixed by project stack |
| react | 19.3.1 | UI | Comes with Next 16 |
| @anthropic-ai/sdk | 1.12.0 | `messages.parse`, `document`/`image` blocks, caching | Official SDK; `@anthropic-ai/sdk/helpers/zod` export `[CITED: claude-api skill typescript/claude-api/tool-use.md:566]` |
| zod | 4.6.7 | Output contracts + validation | Same schema for Claude output and runtime checks |
| better-auth | 1.7.27 | Email+password auth | Fixed by project stack |
| @better-auth/drizzle-adapter | 1.7.27 | Better Auth <-> Drizzle | Docs import `drizzleAdapter` from `"@better-auth/drizzle-adapter"` `[CITED: better-auth.com/docs/adapters/drizzle]` |
| drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 | DB access + `push` | Fixed by project stack |
| pg + @types/pg | 8.23.1 | Postgres driver | Fixed by project stack |
| xlsx (SheetJS) | **0.20.3 from SheetJS CDN, not npm** | Read `.xlsx` and `.xlsb` in import script | See below |

**SheetJS install (important):** the npm registry copy `xlsx` is stuck at `0.18.5` `[VERIFIED: npm view xlsx dist-tags -> latest = 0.18.5]`, which SheetJS no longer publishes to npm. Install the CDN tarball: `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` `[VERIFIED: installed and ran in a scratch dir this session; npm reported 0 vulnerabilities; read all 7 files incl. .xlsb; installed package.json version printed 0.20.3]`. Use it in `scripts/` only (devDependency), never in a request path.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.3.5 | Styling | `create-next-app` default |
| shadcn (CLI) | 4.23.0 | Copy-in components | Checkbox, Table, Tabs, Sheet, Progress, Select, Badge, Dialog, Sonner |
| lucide-react, sonner | 1.77.0 / 2.0.8 | Icons, toasts | via shadcn |
| tsx | 4.23.15 | Run `scripts/*.ts` | `tsx --env-file=.env.local scripts/import-catalogue.ts` |
| vitest | 5.1.1 | Unit tests for pure `domain/` logic | band mapping, parity, CSV, ID validation, normalise+hash |
| voyage embeddings via `fetch` | model `voyage-4`, 1024 dims | **Optional** shortlist alternative | Only if a Voyage key exists; see Alternatives |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plan B shortlist (Claude over cached catalogue) | Voyage `voyage-4` + pgvector cosine | Needs extra key + embed step + vector column. Faster/cheaper per match, but not needed at 1.3k rows. Keep the `Shortlister` interface so it can be swapped in post-demo |
| SheetJS CDN tarball | `exceljs` 4.4.0 | exceljs does not read `.xlsb`; CT file is `.xlsb` |
| Hand-written CSV | `csv-stringify` | Not worth a dependency; ~10 lines + test (Pitfall 14) |

**Installation:**
```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --turbopack
npm i next@16.4.6 react@19.3.1 @anthropic-ai/sdk zod better-auth @better-auth/drizzle-adapter drizzle-orm pg
npm i -D drizzle-kit @types/pg tsx vitest https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npx shadcn@latest init
```

**Version verification:** run on 2026-11-21: next 16.4.6, react 19.3.1, @anthropic-ai/sdk 1.12.0, zod 4.6.7, better-auth 1.7.27, @better-auth/drizzle-adapter 1.7.27, drizzle-orm 0.45.4, drizzle-kit 0.31.11, pg 8.23.1, tailwindcss 4.3.5, shadcn 4.23.0, tsx 4.23.15, vitest 5.1.1. All `[VERIFIED: npm registry]`.

## Package Legitimacy Audit

Seam run (`gsd-tools query package-legitimacy check --ecosystem npm ...`) returned verdicts for the first packages before its output was truncated by my `head`; remaining packages were checked manually (`npm view <pkg> time.created`, `scripts.postinstall`, `repository.url`).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react | npm | 10+ yrs | 275M/wk | github | OK (seam) | Approved |
| zod | npm | 6 yrs (2020-03) | 475M/wk | colinhacks/zod | OK (seam) | Approved |
| next | npm | 15 yrs (2011) | unknown (seam) | vercel/next.js | SUS (seam: too-new, unknown-downloads) | Approved with note: flag is the latest *release* date (2026-11-09), not package age |
| @anthropic-ai/sdk | npm | 3.8 yrs (2023-01) | 74.8M/wk | anthropics/anthropic-sdk-typescript | SUS (seam: too-new) | Approved with note: latest release 2026-11-20 |
| better-auth | npm | 2.6 yrs (2024-04) | 21.2M/wk | better-auth/better-auth | SUS (seam: too-new) | Approved with note: latest release 2026-11-20 |
| @better-auth/drizzle-adapter | npm | 10 mo (2026-01) | n/a | better-auth/better-auth | not seen in truncated output | Approved: monorepo package named in the official Drizzle adapter docs |
| drizzle-orm, drizzle-kit | npm | 5 yrs | n/a | drizzle-team/drizzle-orm | not seen | Approved (manual: no postinstall) |
| pg | npm | 15 yrs | n/a | brianc/node-postgres | not seen | Approved (manual: no postinstall) |
| shadcn, tsx, vitest | npm | 2.4 / 11 / 4.9 yrs | n/a | official repos | not seen | Approved (manual: no postinstall) |
| xlsx (SheetJS CDN tarball) | cdn.sheetjs.com (not npm) | n/a | n/a | SheetJS | n/a (not a registry package) | Approved: vendor's documented install path; used offline only |

**Packages removed due to SLOP verdict:** none.
**Packages flagged SUS:** next, @anthropic-ai/sdk, better-auth. All three are established projects flagged only because their latest release is under ~2 weeks old. Because STACK.md pinned these exact versions on 2026-11-20 and they were smoke-tested then, the planner should add **one** `checkpoint:human-verify` after the first `npm install` ("app builds and `next dev` starts") rather than three separate gates. No `postinstall` scripts found for any package checked `[VERIFIED: npm view scripts.postinstall -> empty]`.

## Architecture Patterns

### System Architecture Diagram

```
 OFFLINE (developer, output committed/seeded)                RUNTIME (next start on laptop)
┌──────────────────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│ data/raw/catalogue-2024-27/*.xlsx|xlsb       │     │ Browser                                     │
│   -> scripts/import-catalogue.ts (SheetJS)   │     │  /sign-in  /matcher  /catalogue  /la  /la/print
│   -> data/seed/catalogue.json  (1,327 rows)  │     └───────┬───────────────────────────┬─────────┘
│ data/raw/fise/AC/<programme>/*.pdf  (manual  │             │ proxy.ts: cookie present?  │
│   browser download from ac.upt.ro folders)   │             ▼                            │
│   -> scripts/pair-fise.ts (code in filename) │     ┌───────────────────────┐            │
│   -> manifest.json (human-confirmed)         │     │ Route handlers (thin) │◄───────────┘
│   -> scripts/extract-fise.ts (Claude doc blk)│     │  requireUser() ->     │
│   -> data/seed/syllabus.json (topics)        │     │  auth.api.getSession  │
│ data/seed/coordinators.json (hand-curated)   │     └─┬─────┬──────┬────────┘
└───────────────┬──────────────────────────────┘       │     │      │
                │ scripts/seed.ts                      ▼     ▼      ▼
                ▼                              services/matcher  services/la   services/catalogue
        ┌───────────────┐                      │  1 normalise+hash -> match_cache hit? -> return
        │ Postgres      │◄─────────────────────┤  2 shortlist (Plan B: Claude over cached
        │ course,       │                      │       compact catalogue -> <=10 candidate ids)
        │ syllabus,     │                      │  3 validate ids ⊆ candidates
        │ faculty,      │                      │  4 rank+explain (Claude): candidates' entries
        │ user-scoped:  │                      │       (+ AC syllabus topics if hasSyllabus)
        │ home_course,  │                      │  5 validate ids again, clamp to 5, band in domain/
        │ la_item,      │                      │  6 join facts + evidence label + coordinator FROM DB
        │ match_cache   │                      ▼
        └───────────────┘                llm/claude.ts (one wrapper: model env, effort, refusal guard)
```

### Recommended Project Structure
```
src/
├── app/                      # pages + thin route handlers
│   ├── api/auth/[...all]/route.ts
│   ├── api/matches/route.ts          # POST one home course -> matches
│   ├── api/extract/route.ts          # POST PDF/image -> pre-fill fields
│   ├── api/la/route.ts, api/la/export.csv/route.ts
│   ├── (app)/matcher|catalogue|la|la/print
│   └── sign-in, sign-up
├── proxy.ts                  # Next 16 (was middleware.ts): cookie presence redirect only
├── domain/                   # PURE, vitest-tested, no IO
│   ├── semester.ts           # odd=Winter, even=Summer
│   ├── bands.ts              # score -> Strong/Partial/Weak
│   ├── normalise.ts          # normalise + sha256 input hash
│   ├── ids.ts                # ensure model ids ⊆ allowed set
│   ├── ects.ts               # winter/summer totals + under/at/over message key
│   └── csv.ts                # escape + BOM + formula-injection guard
├── services/                 # orchestration: matcher.ts, extract.ts, la.ts, catalogue.ts
├── llm/                      # claude.ts (client, model env, refusal guard), prompts/, schemas.ts (zod)
├── db/                       # schema.ts, client.ts (globalThis singleton pool), auth-schema.ts
└── lib/auth.ts, lib/auth-client.ts, lib/require-user.ts
scripts/                      # import-catalogue.ts, pair-fise.ts, extract-fise.ts, seed.ts, golden.ts
data/raw/ data/seed/ data/golden/golden-set.json
docker-compose.yml  drizzle.config.ts
```

### Pattern 1: Better Auth + Drizzle + Next 16
**What:** `lib/auth.ts` with `drizzleAdapter(db, {provider:"pg", schema})`, `emailAndPassword.enabled`, `nextCookies()` as LAST plugin; mount `toNextJsHandler`; `proxy.ts` does a cookie-presence redirect; **every** data handler calls `auth.api.getSession({headers: await headers()})`.
**When to use:** all authenticated routes (D-10).
**Example:**
```typescript
// Source: better-auth.com/docs/integrations/next (fetched 2026-11-21) and /docs/adapters/drizzle
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()], // docs: "make sure this is the last plugin in the array"
});
// src/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
// src/proxy.ts  (docs name: proxy, not middleware)
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
export async function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.redirect(new URL("/sign-in", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/matcher/:path*", "/catalogue/:path*", "/la/:path*"] };
// src/lib/require-user.ts  (call in every handler/server component)
import { headers } from "next/headers";
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Response("Unauthorized", { status: 401 });
  return session.user;
}
```
Schema tables: run `npx auth@latest generate` and paste into `db/schema.ts` `[CITED: better-auth drizzle adapter docs]`. Keep `home_university` in your own `profile` table (user_id FK), not as a Better Auth extra field, to avoid regenerating auth schema. Docs for the proxy say the cookie-only check is "THIS IS NOT SECURE" and recommend checks in each page/route `[CITED: better-auth.com/docs/integrations/next]`; the matcher paths above must not include `/api/auth` and `/sign-in`.

### Pattern 2: Offline catalogue import with header-regex column map (measured)
**What:** For each file: skip sheet `/^lista$/i`; header row = first row with a cell matching `/course unit/i`; map columns with anchored regexes; forward-fill only `programme` (and `field`/`desc`); take faculty from the file name; keep rows that have both a course name and a code; skip `/supliment/i` rows.
**Why:** `[VERIFIED: ran this exact logic on all 7 files this session; 1,327 rows, 0 non-numeric semester/ECTS/year]`.
**Example (trimmed from the verified probe):**
```typescript
// Source: verified probe against data/raw/catalogue-2024-27 (SheetJS 0.20.3)
const roles: [string, RegExp][] = [
  ["programme", /name of the study programme/i], ["field", /field of study/i],
  ["desc", /programme general description/i], ["course", /^course unit/i], // anchor: 'Language the course units...' also contains "course unit"
  ["code", /^codes?\b/i], ["semester", /^semester/i], ["ects", /^ects/i], ["year", /^year of study/i],
  ["hCourse", /^course hours/i], ["hSem", /^seminar hours/i], ["hLab", /^laboratory hours/i], ["hProj", /^project hours/i],
  ["lang", /^language the course/i], ["engMat", /^existence of teaching/i], ["indEng", /^possibility of individual/i],
  ["kw", /^10 keywords/i], ["recommended", /^curs unit recommended/i],
];
// years: if headers match /^year of study/ exactly 3 times (ET Master) => [year, semester, ects] by position
// programme cell matching /^\d(st|nd|rd|th) year$/i (ARH Master) => keep previous programme
```

### Pattern 3: Two-stage matching with validated IDs and DB-sourced facts
**What:** Stage 1 shortlist -> Stage 2 rank/explain. The model sees opaque short ids (`c123` = row id), never invents facts; code (a) checks every returned id is in the allowed set, (b) joins ECTS/semester/year/faculty/programme/language/coordinator from the DB, (c) sets `evidence` from `course.hasSyllabus`, (d) maps score to band in `domain/bands.ts`, (e) drops `covered/missing` for non-syllabus rows.
**Stage 1 (Plan B):** system = instructions + compact catalogue lines `id|code|name|ECTS|S<sem>|faculty|programme|keywords(<=120 chars)` with `cache_control`; semester filter applied in code by pre-filtering the lines (3 cache variants: any/winter/summer). Output `{ids: string[]}` (<=10).
**Stage 2:** user message = home course (name, description, topics, ECTS, year, as delimited data) + candidate blocks. Output `{matches: [{id, score, reason, coveredTopics[], missingTopics[]}]}` sorted, <=5.
**Cache:** key = sha256(normalise(name, description, topics, ects, year) + semesterFilter + catalogueVersion + promptVersion). Store in `match_cache`; `home_course.matches_hash` points to it (D-08/D-09).

### Anti-Patterns to Avoid
- **Using the Faculty column or `code` as identity.** Both are unreliable (Pitfalls 1-2).
- **Letting the model output ECTS/semester/faculty/evidence label.** Violates MATCH-03/11; hallucination risk.
- **Rendering upload/syllabus text as instructions.** Treat as untrusted data in a delimited block (Security).
- **Runtime scraping or ajax-calling ac.upt.ro.** Project constraint plus the plugin endpoint was refused here.
- **One huge Claude call for the whole flow with syllabus topics for all 200 AC courses in the cached prefix.** Works but couples cache size to syllabus collection; keep stage 2 separate.

## Catalogue Import Facts (measured on the real files)

Files in `data/raw/catalogue-2024-27/` (file -> faculty; coordinator from the studies-2026-2027 page, see Open Question 2):

| File (prefix) | Faculty code | Faculty (use coordinator-page name) | Valid rows (Bach+Master) |
|---|---|---|---|
| `Course_catalogue_Automatics and Computing...xlsx` | AC | Automation and Computers | 204 (84+120) |
| `Course Catalogue_CT_...xlsb` | CT | Civil Engineering | 91 (72+19) |
| `Course catalogue_ Power Engineering...xlsx` | ET | Electrical and Power Engineering | 253 (213+40) |
| `Course catalogue_Architecture and Urbanism...xlsx` | ARH | Architecture and City Planning | 184 (147+37) |
| `Course catalogue_IH_...xlsx` | IH | Engineering in Hunedoara | 19 (16+3) |
| `Course_catalogue_MEC_...xlsx` | MEC | Mechanical Engineering | 465 (311+154) |
| `Course_catalogue_RIA_...xlsx` | RIA | Robotics, Artificial Intelligence and Autonomous Systems | 111 (78+33) |
| **Total** | | | **1,327** |

`[VERIFIED: probe run this session]`. RIA = "Robotics, Artificial Intelligence and Autonomous Systems" is established by the coordinator list on the studies-2026-2027 page plus RIA's programmes (Robotics, Drone Engineering, Robotics Systems with AI).

**Verified hazards (each needs handling in the import script):**
1. Sheet names have trailing spaces (`"Licenta 2026-2027 "`); match with `/^licen|^bachelor|^master/i` after trim, skip `/^lista$/i`.
2. Header row index: 0 everywhere except MEC Licenta and RIA Licenta (row 1; row 0 has stray "regenerabile" in col E). RIA Licenta has blank rows directly after the header.
3. **Faculty column is unusable.** 406 blank; polluted values include `"Contact person at Faculty level - ... Name (Nume Prenume): Cosmina VIGARU email: ..."` (310+154 MEC rows), `"Name: SIMO Attila E-mail: ... Tel.: 0256403383"`, `"Tel.:0723444929"`, and ET programme names such as `"Ingineria Sistemelor Electroenergetice - ..."`. Derive faculty from file name only.
4. ET Master has three columns headed `"Year of study - Anul de studiu"`; row 1 data is `1,1,5` = year, semester, ECTS by position. AC, ARH, CT Licenta, IH, MEC, RIA have a single such column.
5. ARH Master programme cells include `"1st year"` / `"2nd year"` (23 rows); do not forward-fill those as programme names.
6. IH Master row 1 is a "Supliment diploma" row (every cell says so); skip by `/supliment/i` on course name (IH Master yields only 3 valid rows).
7. Two rows with a name but no code are skipped (ARH Licenta row 162 "Restaurare theory ... only with Restaurare 2 proiect"; MEC Licenta row 359 "Practica pentru elaborarea proiectului de diploma"). Log them; roadmap's 1,329 included them.
8. **`code` is not unique:** 102 repeated codes (62 span different programmes; many are language electives `*.C7`, and ET/Power has two course names under one code `L200.24.01.F1`). Use surrogate `id = <FACULTY>-<B|M>-<sheetRow>`; keep `code` non-unique and indexed. AC codes ARE unique (204 distinct), so fișă pairing by code is safe for AC.
9. Language values: `ROMANIAN - ROMÂNĂ` 925, `ENGLISH - ENGLEZĂ` 118, `English` 46, `FRENCH - FRANCEZĂ` 8, `GERMAN - GERMANĂ` 8, blank 222 (AC has no language column for bachelor; 202 AC rows blank). Store raw string + a normalised label (`/^english/i` -> "English", etc.) for D-03 "Listed language".
10. `recommended` values: long "Yes, if participants are familiar..." text (453), `Yes - Da` (330), `Yes`/`Yes - da`, `No - Nu`, blank 507; one polluted value (a keyword string in a RIA/MEC row). Store a normalised `recommendedForInternational` enum `yes | conditional | no | unknown`.
11. Semesters run 1-10 (9 and 10 are ARH 6-year); years 1-5; ECTS 1-15 (15 = internship/thesis rows). 7 rows have year != ceil(semester/2) (some Master programmes, e.g. `M421.25.03.F1-01` semester 3 year 1): store both as written, never derive one from the other. Odd = Winter, even = Summer holds for all.
12. Keywords exist for only 469 of 1,327 rows (ET 337/456, CT 38/91, others 94/780; AC has none). AC and many MEC rows have the **name only** as evidence. State this in the UI via the "Compared by catalogue entry" label and keep the reason wording honest ("limited information").
13. Names are bilingual and inconsistent: `"EN - RO"`, `"RO/EN"`, `"EN (RO)"`, `"Elective 1.-2. EN / Opțional 1.-2. RO"` (AC: 111 rows). Keep the raw string; do not split. Claude reads bilingual names fine.
14. Programme description (`desc`) is only on the first row of each programme (merged cell): forward-fill within the programme.

**Plan B size (measured):** compact `code|name|ECTS|S|programme` lines for all 1,327 rows = 141,861 chars; with up to 200-char keywords = 225,859 chars. At ~3.2 chars/token `[ASSUMED]` that is ~44k and ~71k tokens, far under the 1M window. Measure the real number with `client.messages.countTokens` once the key exists.

## AC Fișe Disciplinei: Where They Live and How to Collect Them

**Finding `[VERIFIED: curl GET of 10 public ac.upt.ro pages + HTML inspection]`:** each AC programme page has two embedded folder browsers titled "Planuri de învățământ" and "Fișele disciplinelor". They are the "Share-one-Drive" WordPress plugin bound to a SharePoint drive (`data-drive-id='b!P9iL_x2W...'`). The page HTML contains no PDF links (0 `.pdf` hrefs on all 10 pages); listings load via `wp-admin/admin-ajax.php`. I did not call that endpoint (the sandbox refused it as unauthorised access), so it is **unverified** whether an anonymous listing works. This matches the catalogue situation: the user downloads in a browser.

Pages that cover the catalogue's AC programmes `[VERIFIED: master list page ac.upt.ro/master/ and licenta page + per-page h3 check]`:
- Bachelor: `https://ac.upt.ro/specializari/calculatoare-engleza/` (82 catalogue rows), `.../calculatoare-romana/` (1), `.../tehnologia-informatiei/` (1)
- Master: `.../automotive-embedded-software/`, `.../cloud-computing-and-internet-of-things/`, `.../digital-media-and-web-development-dmwd/`, `.../game-development/`, `.../machine-learning-ml/`, `.../quantum-computing-qc/`, `.../software-engineering-se/`

Recommended collection workflow (planner: make it a **human task with a fallback**, not a blocker):
1. User opens the "Fișele disciplinelor" folder on each page, downloads all (the plugin lists a "Create zip file" action `[ASSUMED: enabled]`), unzips into `data/raw/fise/AC/<page-slug>/`. Start with `calculatoare-engleza` (covers 82 of 84 bachelor rows) and `machine-learning-ml`; stop whenever time runs out.
2. `scripts/pair-fise.ts`: derive code from the **file name** with `/[LM]\.?\d+\.\d+\.\d+\.\w+(-\d+)?/`; the sample UPT fișă I could read is named `13_L233.25.02.F3_Programarea Calculatoarelor.pdf` (other UPT faculty) so UPT does put the code in the name there; AC naming is `[ASSUMED]`. Pair only when the extracted code exists in the AC catalogue rows. Unpaired files go to `manifest.unpaired.csv` for a human to resolve (never fuzzy-matched; user rule "never by guess").
3. The fișă header itself has **no code field** `[VERIFIED: text extraction of a real UPT fișă from etc.upt.ro, same UPT template]`: it has 2.1a name (RO/category), 2.1b English name, 2.4 year, 2.5 semester, 3.8 credits, and "8. Conținuturi" (8.1 course, 8.2 applied activities). So a sanity check of a pair = English name + year + semester + credits against the catalogue row; a mismatch flags it for review but does not pair on its own.
4. `scripts/extract-fise.ts`: send each paired PDF as a `document` block, structured output `{docLanguage, academicYear, objectives[], courseTopics[], appliedTopics[]}` with `claude-opus-5-5` offline (CLAUDE.md). Write `data/seed/syllabus.json` keyed by catalogue row id, plus the manifest (catalogue code, course name, local file, original URL, document language, academic year, download date).
5. "Original UPT URL" = the programme page above (no per-file public URL exists unless the user pastes a SharePoint share link); record this honestly in the manifest and show "Official source: <programme page>" in the syllabus view. This weakens the roadmap wording "link to the official PDF" (Open Question 1).

Other faculties do host static fișă PDFs (`fih.upt.ro`, `ct.upt.ro`, `etc.upt.ro`) `[CITED: search results]`, but they are v2 (MATCH-V2-03).

## Claude Call Shapes

All `[CITED: claude-api skill typescript/claude-api/tool-use.md:559-595, README.md:140-178, SKILL.md]` unless marked. No call has been executed (no API key in this environment).

**Model rules for `claude-sonnet-5-5` and `claude-opus-5-5`** (`[CITED: claude-api skill]`): `thinking: {type:"disabled"}` and `budget_tokens` return 400; forced `tool_choice` any/tool returns 400; non-default `temperature/top_p/top_k` return 400 (Sonnet 5.5); no assistant prefill; thinking is on by default; effort default is `high` on Sonnet 5.5 and `medium` on Opus 5.5, so set it explicitly. Use `output_config.effort`, `"low"` for shortlist, `"medium"` for rank/explain and extraction `[ASSUMED: low/medium choices; tune on the golden set]`.

**Refusals:** always check `stop_reason === "refusal"` before reading content. The skill recommends opting into server-side `fallbacks` for Sonnet 5.5 by default; CLAUDE.md marks this optional for a demo. Recommended: skip fallbacks, return a friendly "could not match this course, try rewording" error, and let the user re-run (D-09).

**Prompt caching:** `system` block with `cache_control: {type:"ephemeral"}` (default TTL 5 min); `ttl: "1h"` is also documented. For a demo use the 1h form and send one throwaway warm-up call right before presenting (`max_tokens: 0` pre-warm is mentioned in the skill's caching guide `[CITED: SKILL.md Common Pitfalls]`). Verify with `usage.cache_read_input_tokens > 0` on the second call. Any byte change in the catalogue block (e.g. unsorted rows, timestamp) silently invalidates it: sort by id, no dates.

### Code Examples

**Stage 2 rank/explain (structured output):**
```typescript
// Source: claude-api skill tool-use.md "JSON Outputs (Zod)"; adapt for Sonnet 5.5
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
const Match = z.object({
  id: z.string(), score: z.number(), reason: z.string(),
  coveredTopics: z.array(z.string()), missingTopics: z.array(z.string()),
});
const Out = z.object({ matches: z.array(Match) });
const res = await client.messages.parse({
  model: process.env.CLAUDE_MODEL!,            // claude-sonnet-5-5
  max_tokens: 4000,
  output_config: { effort: "medium", format: zodOutputFormat(Out) }, // combined keys: [ASSUMED] smoke-test in Wave 0
  system: [{ type: "text", text: RANK_INSTRUCTIONS }],
  messages: [{ role: "user", content: buildRankPrompt(home, candidates) }],
});
if (res.stop_reason === "refusal" || !res.parsed_output) throw new MatchError("model_unavailable");
const allowed = new Set(candidates.map((c) => c.id));
const clean = res.parsed_output.matches.filter((m) => allowed.has(m.id)); // drop invented ids
```
Keep the zod schema plain (no `.min/.max/.regex`): range-check score and clamp in code afterwards `[ASSUMED: structured-output JSON schema subset limits]`.

**Stage 1 shortlist with cached catalogue:**
```typescript
system: [
  { type: "text", text: SHORTLIST_INSTRUCTIONS },
  { type: "text", text: catalogueLines /* sorted by id, deterministic */,
    cache_control: { type: "ephemeral", ttl: "1h" } },
],
messages: [{ role: "user", content: homeCourseBlock }],
```

**Upload extraction (PDF or image, one function):**
```typescript
// Source: claude-api skill SKILL.md "Document & File Input"; document block BEFORE the text block
const media =
  kind === "pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
    : { type: "image", source: { type: "base64", media_type: mime /* image/png|image/jpeg */, data: b64 } };
const res = await client.messages.parse({
  model: process.env.CLAUDE_MODEL!, max_tokens: 3000,
  output_config: { effort: "medium", format: zodOutputFormat(ExtractedCourse) },
  messages: [{ role: "user", content: [media, { type: "text", text: EXTRACT_PROMPT }] }],
});
// ExtractedCourse = { name, description, ects: number|null, studyYear: number|null, topics: string[], multipleCoursesDetected: boolean }
```
Base64 must contain no newlines; PDF limit 32 MB / 600 pages `[CITED: skill]`.

**Optional Voyage + pgvector path (only if a key exists):**
```typescript
// Source: orm.drizzle.team/docs/guides/vector-similarity-search (fetched)
import { index, pgTable, text, vector } from "drizzle-orm/pg-core";
import { cosineDistance, desc, sql } from "drizzle-orm";
embedding: vector("embedding", { dimensions: 1024 }),
(t) => [index("course_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops"))]
const sim = sql<number>`1 - (${cosineDistance(course.embedding, queryVec)})`;
await db.select({ id: course.id, sim }).from(course).orderBy(desc(sim)).limit(15);
```
Drizzle does **not** create the extension: run `CREATE EXTENSION IF NOT EXISTS vector;` yourself (a `db:init` script before `drizzle-kit push`) `[CITED: drizzle guide: "Drizzle doesn't create extension automatically"]`.

**CSV (D-13), with formula-injection guard and BOM:**
```typescript
const BOM = String.fromCharCode(0xfeff); // UTF-8 byte-order mark so Excel detects UTF-8
const esc = (v: string | number | null) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;           // spreadsheet formula injection (home course names are user input)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows: (string | number | null)[][]) => BOM + rows.map((r) => r.map(esc).join(",")).join("\r\n");
```
BOM so Excel shows Romanian diacritics `[ASSUMED]`. Header `Semester,UPT code,UPT course,Faculty,Programme,Study year,ECTS,Matched home course,Home course ECTS`. Response: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="erasmus-upt-la.csv"`.

**Drizzle schema sketch (tables, not full):** `course(id pk text, facultyCode, level 'B'|'M', programme, field, programmeDesc, name, code idx, studyYear, semester, ects, hoursJson, listedLanguage raw, languageLabel, engMaterials, indivEnglish, recommendedForIntl enum, keywords, sourceYear '2026-27', sourceFile, sourceRow, hasSyllabus bool)`; `syllabus(courseId pk fk, topicsJson, objectivesJson, docLanguage, academicYear, localFile, originalUrl, downloadedAt)`; `faculty(code pk, name, coordinatorName, coordinatorEmail, sourceUrl, checkedOn)`; user-scoped: `profile(userId pk, homeUniversity)`, `home_course(id, userId, name, description, topicsJson, ects, studyYear, semesterFilter, matchesHash)`, `match_cache(hash pk, resultJson, model, promptVersion, createdAt)`, `la_item(id, userId, courseId, homeCourseId null, addedAt, unique(userId, courseId))`. Filtered columns indexed: `facultyCode, semester, ects, hasSyllabus`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing, sessions, cookies | Custom auth | Better Auth | Fixed by stack; security-critical |
| Reading `.xls/.xlsx/.xlsb` | Custom zip/XML parsing | SheetJS 0.20.3 (CDN) | `.xlsb` is binary BIFF12 |
| Reading syllabus PDFs / screenshots | `pdf-parse`/`pdfjs`/OCR | Claude `document` / `image` block + zod | Text extraction destroys layout (STACK.md rule). Note: I used `pdfjs-dist` only for a one-off research probe, not for the app |
| Similarity search | Custom cosine/ANN | Claude shortlist (Plan B) or pgvector `<=>` | 1.3k rows |
| Structured JSON from the model | Parse free text / forced tool_choice | `messages.parse` + `zodOutputFormat` | Forced tool_choice 400s on these models |
| PDF generation for print view | PDF library | Browser print + `@media print` CSS | D-14 |
| UI primitives | Custom table/tabs/meter | shadcn components | Speed |
| Score->band thresholds | Model-written bands | `domain/bands.ts` constants | Deterministic, testable |

**Key insight:** the only genuinely custom code is the import normaliser, the ID-validated matching service and the LA/CSV domain logic. Keep those pure and tested.

## Runtime State Inventory

Not a rename/refactor/migration phase: greenfield (no `package.json`, no app code). Omitted.

## Common Pitfalls

### Pitfall 1: Treating `code` as a primary key
**What goes wrong:** upsert by code silently drops ~102 rows; LA links collide. **Why:** the same code is reused for alternative electives/programmes. **Avoid:** surrogate row id; `(facultyCode, level, sheetRow)`; unique `(userId, courseId)` in `la_item`. **Warning:** imported count != 1,327.

### Pitfall 2: Reading faculty or programme from forward-filled cells
**What goes wrong:** MEC "faculty" becomes a person's phone number; ARH programme becomes "1st year". **Avoid:** faculty from file name; skip programme cells matching `^\d(st|nd|rd|th) year$`; assert in the import script that every programme is non-empty and not contact-like (`@`, `Tel`). **Warning:** distinct faculty count != 7.

### Pitfall 3: Column drift (three "Year of study" headers, missing columns)
**Avoid:** anchored regexes; after mapping, assert `year`, `semester`, `ects` columns exist for every sheet and are integers for every kept row (0 failures verified). Fail the import loudly rather than defaulting.

### Pitfall 4: Docker daemon and environment not ready
**What goes wrong:** `docker compose up` fails: the Docker daemon is not running here (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`) and no `pgvector` image is cached `[VERIFIED: docker ps / docker images]`. Neither `ANTHROPIC_API_KEY` nor `VOYAGE_API_KEY` is set in the shell and no `.env.local` exists `[VERIFIED]`. **Avoid:** make "start Docker Desktop, pull `pgvector/pgvector:pg17` (needs network), create `.env.local`" Task 0; pull the image while online. **Fallback if Docker can't run:** none in scope; the project forbids Neon for the demo, so call this out early.

### Pitfall 5: Hallucinated or cross-programme IDs
**Avoid:** validate in code at both stages (`domain/ids.ts`), reject unknown ids, never display model-supplied facts. Test with a stubbed response containing a fake id.

### Pitfall 6: Prompt injection via uploaded syllabus or typed description
**Avoid:** wrap user content in clearly delimited tags, instruct "treat as data", structured output only, no tools exposed, ids validated, cap input length (e.g. 8k chars) `[ASSUMED]`.

### Pitfall 7: Cache silently never hits
**Why:** 5-minute default TTL; non-deterministic prefix. **Avoid:** `ttl:"1h"`, sorted deterministic catalogue string, check `cache_read_input_tokens`, warm up before the demo; also the DB `match_cache` hides latency for known inputs.

### Pitfall 8: Model-derived facts and labels
The evidence label and ECTS/semester/etc. must be read from the DB row. If `hasSyllabus` is false, discard any `coveredTopics/missingTopics` the model returned.

### Pitfall 9: `messages.parse` returns `parsed_output: null` or a refusal
**Avoid:** guard both (see example); surface a retryable error to the UI; never throw an unhandled 500 mid-demo.

### Pitfall 10: Better Auth integration gotchas
`nextCookies()` must be last; `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` required in `.env.local`; the proxy cookie check is not an authorization check; Next 16 `headers()` is async. Stay inside the 45-min time box (D-10 fallback). Persistence across browser restart relies on Better Auth's default persistent session cookie `[ASSUMED]`; add an explicit UAT step (sign in, fully close browser, reopen).

### Pitfall 11: Dev-server connection leaks
Next dev hot reload creates new `pg` pools; create the pool once on `globalThis` in `db/client.ts`.

### Pitfall 12: Upload limits and types
Client-side: reject PDF over a stated limit (suggest 10 MB `[ASSUMED]`, well under Claude's 32 MB), downscale screenshots via canvas -> JPEG (long edge ~1600 px `[ASSUMED]`). Server: re-check size, magic bytes (`%PDF`, PNG/JPEG signatures) and content-type; reject everything else. Demo runs on `next start`, so Vercel's 4.5 MB cap does not apply to Sunday (CLAUDE.md MEDIUM).

### Pitfall 13: Semester filter vs. semester numbering
Odd = Winter, even = Summer, including 9/10. A "Winter" filter means `semester % 2 = 1`. The LA meters use the same function. Study year is display-only (D-04).

### Pitfall 14: CSV and print
Formula injection (user-entered home course names) and Excel diacritics (BOM) are covered in the CSV example; print view must not depend on JS state that disappears on print (render from the same server data).

### Pitfall 15: Stale spec text
D-02 removes MATCH-06; REQUIREMENTS.md still lists it as pending and ROADMAP criterion 5 still says "English-taught only is on by default". Add a doc-edit task so verifiers do not fail the phase on a removed criterion.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` (export `proxy`) | Next 16 | Better Auth docs use `proxy.ts` `[CITED]` |
| `output_format` param / forced tool_choice for JSON | `output_config.format` + `messages.parse` + `zodOutputFormat` | 2025-26 | Forced tool_choice 400s on Sonnet 5.5/Opus 5.5 |
| `thinking: {type:"enabled", budget_tokens}` | adaptive thinking + `output_config.effort` | 2026 | `budget_tokens` rejected with 400 |
| `xlsx` from npm | `xlsx` from cdn.sheetjs.com | npm copy frozen at 0.18.5 | Use CDN tarball |

**Deprecated/outdated:** npm `xlsx@0.18.5`; Drizzle docs show a v1.0 beta banner, but `drizzle-orm@0.45.4` supports `vector`, `cosineDistance` and the `hnsw` index (guide requires >= 0.31.0) `[CITED: orm.drizzle.team guide]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Better Auth default session cookie persists across browser restarts and a default expiry is long enough | Pitfall 10 | PLAT-01 criterion 1 fails; fix with `session.expiresIn` config. Covered by a UAT step |
| A2 | ~3.2 chars/token for the compact catalogue (44k-71k tokens) | Catalogue facts | Cost/latency estimate only; real count via `countTokens` |
| A3 | `output_config: {effort, format}` can be combined in one call | Code Examples | 400 on first call; Wave 0 smoke test (needs API key) |
| A4 | Structured-output schemas should avoid min/max constraints | Code Examples | Validation errors; fall back to post-hoc zod checks |
| A5 | Score bands Strong >= 70, Partial 40-69, Weak < 40 (starting values) | Pattern 3 | Wrong grey-out of good matches; tune on the golden set |
| A6 | Effort `low` for shortlist, `medium` for rank/explain/extraction | Claude Call Shapes | Latency/quality; tune on golden set |
| A7 | AC fișă file names contain the catalogue code like the etc.upt.ro sample | AC fișe section | Pairing falls back to the human-confirmed manifest; more manual work |
| A8 | The plugin's "Create zip file" is enabled for AC folders | AC fișe section | User downloads files one by one |
| A9 | AC fișe are PDFs (could be .docx) | AC fișe section | Extraction script must accept docx or convert |
| A10 | 10 MB PDF limit, 1600 px screenshot edge, 8k-char text cap | Pitfall 12 / 6 | UX only; user may prefer other numbers |
| A11 | BOM makes Excel show diacritics correctly | CSV | Garbled "ă/ș" in CSV opened in Excel |
| A12 | Docker image `pgvector/pgvector:pg17` can be pulled (network) | Pitfall 4 | Blocks DB until online |

## Open Questions (RESOLVED)

All five questions are resolved (2026-11-21). Each item names where the resolution lives.

1. **Official link per AC fișă (MATCH-10, criterion 5 "link to the official PDF").** **RESOLVED: programme-page fallback.** Plan 01-06: `originalUrl` = the programme page with `originalUrlKind: "programme-page"`, overridden by an optional per-file share link from `data/raw/fise/AC/links.json`; the syllabus view says "Official source: <programme page>" (01-06 must_haves prohibition); courses without a fișă show "Syllabus not available yet".
   - Known: files live only inside an embedded SharePoint folder per programme page; no static per-file URL is public.
   - Unclear: whether the user can obtain per-file share links.
   - Recommendation: manifest `originalUrl` = the programme page (honest); optional per-file share link overrides it. Show "Syllabus not available yet" when no fișă.
2. **D-16 source mismatch.** **RESOLVED: user approved the studies-2026-2027 page; D-16 amended 2026-11-21 in 01-CONTEXT.md.** Plan 01-02 Task 1 seeds `data/seed/coordinators.json` from that page (no decision checkpoint remains). The contact page named in D-16 (`international.upt.ro/en/contact/`) lists no faculty coordinators: only `erasmus.outgoing@upt.ro`, `student-admissions@upt.ro` and phones `[VERIFIED: curl of raw HTML]`. The coordinator table is on `https://international.upt.ro/en/incoming-students/erasmus-studies/studies-2026-2027/` under "Host faculty at Politehnica University Timișoara" `[VERIFIED: curl + text extraction, 2026-11-21]`: AC Ciprian-Bogdan Chirilă ciprian.chirila@upt.ro; ARH Cătălina Bocan catalina.bocan@upt.ro; CT Sorin Herban sorin.herban@upt.ro; ET Attila Simo attila.simo@upt.ro; IH Sorin-Aurel Rațiu sorin.ratiu@upt.ro; MEC Cosmina Vigaru cosmina.vigaru@upt.ro; RIA Oana-Sorina Chirilă oana-sorina.chirila@upt.ro; also (missing-faculty line) ETC Muguraș Mocofan, MPT Ilie Tăucean, Chemistry Ana-Maria Pană, Communication Sciences Simona-Cristina Șimon. The file-embedded contacts for MEC (Vigaru), IH (Rațiu) and ET (Simo) match this table. Recommendation: seed from this page and set `sourceUrl` to it; confirm with the user that the swap of source URL is acceptable (it is an official UPT page and keeps D-16's intent). Note the page's faculty names differ slightly from file names (e.g. "Architecture and City Planning").
3. **Voyage key / Anthropic key.** **RESOLVED: Plan B (no Voyage key needed); the Anthropic key is a blocking setup step.** Plan 01-01 `user_setup` (anthropic) and its Task 2 `checkpoint:human-action` put `ANTHROPIC_API_KEY` into `.env.local` and verify the prefix; Plans 01-03, 01-04 and 01-06 state it as a precondition. Neither is present in the research environment. Plan B needs only the Anthropic key; confirm it exists before the golden-set gate.
4. **REQUIREMENTS traceability for MATCH-06.** **RESOLVED: Plan 01-02 Task 2** marks MATCH-06 "Removed 2026-11-21 by Phase 1 CONTEXT D-02" (requirement line + traceability row "Removed (D-02)"), rewrites ROADMAP criterion 5 without the English-only sentence, and corrects the other stale ROADMAP lines (requirements list, row count, AC Master language note). D-02 says remove; suggest marking `MATCH-06` "Removed (superseded by D-02)" in REQUIREMENTS.md and the traceability table, and rewriting ROADMAP criterion 5 without the English-only sentence. Planner decides exact wording.
5. **Golden-set ground truth.** **RESOLVED: named human gate in Plan 01-03 Task 2** ("Golden-set ground-truth review"): the automated gate checks the starter codes, and a human reads the printed top-3 per case in the SUMMARY and judges whether a coordinator would plausibly accept them. Expected UPT matches need a human who knows the equivalences; the starter pairs below only prove the target rows exist.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | yes | v24.19.0 | — |
| npm | install | yes | (ran) | — |
| Docker CLI | DB | yes | 29.9.1 | — |
| Docker daemon | Postgres+pgvector | **no** (pipe not found) | — | Start Docker Desktop; none otherwise |
| `pgvector/pgvector:pg17` image | DB | **no** (nothing cached) | — | Pull when online |
| `ANTHROPIC_API_KEY` | matcher, extraction, fișă extraction | **not set** in shell; no `.env.local` | — | User must supply; blocks golden set |
| `VOYAGE_API_KEY` | optional shortlist | not set | — | Plan B (recommended anyway) |
| `pdftoppm`/poppler | none needed | no | — | Not required; Claude reads PDFs |
| Network to ac.upt.ro / international.upt.ro | research only | yes | — | — |
| Catalogue files | import | yes (7 files in `data/raw/catalogue-2024-27/`) | — | — |
| AC fișe PDFs | MATCH-10/11 | **no** (`data/raw/fise/` absent) | — | Manual browser download; feature degrades to "Syllabus not available yet" |

**Missing with no fallback:** Docker daemon/image, Anthropic API key.
**Missing with fallback:** Voyage key (Plan B), AC fișe (graceful degradation).

## Validation Architecture

`workflow.nyquist_validation` is `false` in `.planning/config.json`, so the standard per-requirement map is skipped. This compact section covers only what the orchestrator asked for: the golden-set quality gate.

| Property | Value |
|----------|-------|
| Framework | vitest 5.1.1 for pure `domain/` tests; `tsx scripts/golden.ts` for the live-model gate |
| Quick run | `npx vitest run` (domain only, no network) |
| Gate run | `npx tsx --env-file=.env.local scripts/golden.ts` (costs a few cents; needs API key + seeded DB) |

**Domain unit tests (Wave 0, no key needed):** semester parity (1,2,9,10), band thresholds at boundaries, ECTS totals + under/at/over key per meter, `normalise`+hash stability (case/whitespace/diacritics, filter included), `ids` rejects unknown ids, `toCsv` quoting + formula guard + BOM, import normaliser on fixtures (3 header variants, 3x "Year of study", ARH "1st year", IH "Supliment" row, MEC contact text) and a count assertion `1327`.

**Golden set (`data/golden/golden-set.json`, 10-15 cases):** `{ home: {name, description?}, expectCodesTop3: string[], filter?: "winter"|"summer" }`, plus 1-2 negative cases expecting only Weak bands. Script prints top-3 per case with band and reason, and a PASS/FAIL line (pass = any expected code in top-3). Starter pairs whose target rows exist in the catalogue (existence verified, equivalence NOT verified, needs human confirmation `[ASSUMED]`): "Data Structures and Algorithms" -> L002.25.03.F2; "Operating Systems" -> L002.25.04.F4; "Databases" -> L002.25.03.F1 or L310.26.03.S3; "Computer Networks" -> L002.25.04.F3; "Object-Oriented Programming" -> L002.25.03.F3; "Fundamentals of Machine Learning" -> M3.26.01.S1-01; "Thermodynamics" -> L431.25.03.F5; "Fluid Mechanics" -> L431.25.04.F6 or L.154.26.03.F5; "Strength of Materials" -> L431.25.03.F3 or L.154.26.04.F1; "Electrical Machines" -> L200.23.04.D1; "Principles of Urban Planning" -> L061.25.04.S8. Add at least one AC case with a collected fișă to check covered/missing topics, and one negative ("Ancient Greek Philosophy").
**Sampling:** domain tests on every commit; golden run after any prompt/model/threshold change and before UI polish (roadmap gate).

## Security Domain

`security_enforcement` is on (ASVS level 1, block on high).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Better Auth email+password (hashing, rate limiting defaults); set strong `BETTER_AUTH_SECRET` |
| V3 Session Management | yes | Better Auth session cookie; verify httpOnly/sameSite defaults `[ASSUMED]`; sign-out invalidates server session |
| V4 Access Control | yes | `requireUser()` in every handler; every user-scoped query filters by `userId` (home_course, la_item, match results); IDOR test |
| V5 Input Validation | yes | zod on every request body; file magic-byte/size checks; length caps; params validated |
| V6 Cryptography | no (library-handled) | Never hand-roll; no custom crypto |
| V12 Files/Resources | yes | Upload type/size limits, no file persisted unless needed, no path from user input |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via uploaded syllabus/typed text | Tampering | Delimited data, structured output, validated ids, no tools, facts from DB |
| IDOR on home courses / LA rows | Info disclosure | Scope all queries by session user id; integration test with two users |
| CSV/formula injection in export | Tampering | `'` prefix guard in `toCsv` |
| Stored XSS via home-course names | Tampering | React escaping; never `dangerouslySetInnerHTML` on user/model text |
| API key leakage | Info disclosure | Server-only env vars, no `NEXT_PUBLIC_` prefix, `.env*.local` already gitignored `[VERIFIED: .gitignore]` |
| Cost abuse of Claude endpoints | DoS / economic | Auth required (D-10), per-user simple rate limit on `/api/matches` and `/api/extract`, Anthropic spend limit |
| Oversize/malformed upload | DoS | Client + server limits, reject non-PDF/PNG/JPEG |
| Open redirect / trusted origins | Tampering | Configure Better Auth `baseURL`/trusted origins for localhost only |

## Project Constraints (from CLAUDE.md)

- Stack fixed: TypeScript on Node 24, Next.js 16 App Router, Drizzle + `pg`, Better Auth, `@anthropic-ai/sdk`, Zod, shadcn/Tailwind 4, vitest only for pure logic; plain Postgres + pgvector in Docker (`pgvector/pgvector:pg17`) for dev/demo.
- Claude: `messages.parse` + `zodOutputFormat` with `output_config.format` (not deprecated `output_format`); no forced `tool_choice`; no `temperature/top_p/top_k`; no prefill; never `thinking:{type:"disabled"}`; set `output_config.effort` explicitly; PDF `document` block before text; check `stop_reason === "refusal"`; model IDs from `CLAUDE_MODEL` env (`claude-sonnet-5-5` runtime, `claude-opus-5-5` offline ingestion).
- Seed/pre-processed data over runtime scraping; no runtime upt.ro access.
- Admin/legal content must come from official UPT sources (coordinator contacts: official pages only).
- No local embedding models, no LangChain/LlamaIndex, no pdf-parse/pdfjs for catalogue/timetable extraction, no standalone vector DB.
- Business logic in `domain/` + `services/` behind thin route handlers (mobile reuse).
- GSD enforcement: all file edits through GSD workflow commands. Project skills present: `impeccable` (frontend design) and `karpathy-guidelines`; frontend tasks should follow the "City Lines" design (`prototype/index.html`, `COLOR-GUIDE.md`).
- Demo-ready Sunday 2026-11-22: favour fewest moving parts; Better Auth hard 45-min time box with anonymous-cookie fallback.

## Sources

### Primary (HIGH confidence)
- Real files: `data/raw/catalogue-2024-27/*` (read with SheetJS 0.20.3 in a scratch dir this session)
- `https://www.better-auth.com/docs/integrations/next` and `.../docs/adapters/drizzle` (fetched via curl 2026-11-21): route handler, `nextCookies`, `proxy.ts`, `getSession`, adapter import and `npx auth@latest generate`
- `https://orm.drizzle.team/docs/guides/vector-similarity-search` (fetched): `vector`, `hnsw`, `cosineDistance`, manual `CREATE EXTENSION`
- claude-api skill (bundled, cached 2026-11-03): model IDs/behaviours, `messages.parse`, `zodOutputFormat`, `cache_control`, document/image blocks, refusal handling
- `npm view` (2026-11-21) for all versions, ages, `postinstall`
- `https://international.upt.ro/en/incoming-students/erasmus-studies/studies-2026-2027/` and `.../en/contact/` (raw HTML via curl): coordinator table; contact page content
- `https://ac.upt.ro/licenta/`, `/master/`, 10 `/specializari/*` pages (curl): embedded SharePoint folder structure, no PDF links

### Secondary (MEDIUM confidence)
- WebFetch/WebSearch summaries of ac.upt.ro and other UPT faculty sites (fișe hosting elsewhere)
- Real UPT fișă from etc.upt.ro (`13_L233.25.02.F3_Programarea Calculatoarelor.pdf`), text extracted with pdfjs in a scratch dir: template section layout (different faculty, same UPT template)

### Tertiary (LOW confidence)
- Chars-per-token ratio, effort levels, band thresholds, upload limits (all in Assumptions Log)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, versions verified against the registry and equal to STACK.md
- Catalogue import: HIGH, measured on all 7 files
- AC fișe collection: MEDIUM, hosting verified, automation deliberately not attempted, file naming unverified
- Claude call shapes: MEDIUM, from official skill docs, not executed
- Architecture/pitfalls: MEDIUM-HIGH

**Research date:** 2026-11-21
**Valid until:** 2026-11-28 (fast-moving SDK/model details; demo deadline is 2026-11-22)
