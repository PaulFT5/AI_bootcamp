<!-- GSD:project-start source:PROJECT.md -->

## Project

**Erasmus@UPT**

Erasmus@UPT is an English-first web assistant for incoming Erasmus+ exchange students (Studies and Traineeships, EU/EEA KA131 and Non-EU KA171) arriving at Politehnica University of Timișoara (UPT), Romania. It replaces scattered PDFs, Romanian-only maps, 10+ disconnected faculty timetable subdomains and informal WhatsApp groups with one unified tool covering a student's critical first weeks: choosing courses, completing paperwork, and building a personal timetable.

**Core Value:** An incoming student can enter their home-university courses and get ranked, explained UPT course matches (ECTS, semester, faculty, English status) they can put straight into their Learning Agreement.

### Constraints

- **Timeline**: Demo-ready by Sunday 2026-11-22 — ruthless scope; seed/pre-processed data over live scraping at runtime
- **AI provider**: Claude API (matching rationale, PDF/screenshot timetable extraction via vision) — user has/can get an API key
- **Tech stack**: No bootcamp constraint — pick what ships fastest
- **Platform**: Web only (responsive) for now; a colleague's mobile app will later call this same backend
- **Database**: Plain Postgres + pgvector (`pgvector/pgvector:pg17`) in Docker via docker compose; development and the demo run on the laptop. User testing runs on Vercel + Neon (Postgres 17), reached by changing `DATABASE_URL`, then `CREATE EXTENSION vector` + `drizzle-kit push` + reseed
- **Catalogue access**: Current 2024-27 Erasmus catalogues sit in SharePoint folders that block automated fetch — user must download them in a browser; fallback is the public 2021-22 `.xls` catalogue (~2,700 rows)
- **Data accuracy**: Admin/legal checklist content must come from official UPT guides, not invented — wrong paperwork advice harms students

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version (npm, verified 2026-11-20) | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript on Node 24 | Node 24.19 (installed) | Single language for UI, API, ingestion scripts, AI calls | One language = agent never context-switches; Claude SDK, Zod helpers and all libs below are first-class TS. |
| Next.js (App Router) | 16.4.6 | Full-stack framework, single deploy | Pages + Server Actions + Route Handlers in one repo, deploys to Vercel with zero config, best AI-agent training coverage. Node >=20.9 required (OK). In Next 16 `middleware.ts` is renamed `proxy.ts` (Better Auth docs confirm). |
| React | 19.3.1 | UI | Comes with Next 16. |
| @anthropic-ai/sdk | 1.12.0 | Claude API (matching rerank, timetable/PDF extraction, ingestion) | Official SDK. Has `messages.parse()` + `zodOutputFormat` (verified export at `@anthropic-ai/sdk/helpers/zod`). Peer dep zod ^3.25 or ^4 (OK with 4.6.7). |
| Zod | 4.6.7 | Schemas for structured outputs, form validation, seed-data validation | Same schema defines Claude's output contract AND runtime validation. |
| Better Auth | 1.7.27 | Email+password accounts | Library-in-your-repo (no external dashboard/keys), Next 16 `proxy.ts` documented, Drizzle adapter. Auth.js is effectively superseded by it. |
| Drizzle ORM + drizzle-kit | 0.45.4 / 0.31.11 | Type-safe DB access + `drizzle-kit push` | No codegen step (unlike Prisma), SQL-like, native `vector()` column type for pgvector. Better Auth peer range matches (`drizzle-orm ^0.45.2`, `drizzle-kit >=0.31.4`). |
| PostgreSQL + pgvector: Docker (`pgvector/pgvector:pg17`) for dev/demo, Neon (Postgres 17) for user testing | managed | Users, saved selections, checklist progress, schedules, courses + embeddings | **Decided 2026-11-20:** Docker is offline, fast, freely resettable and already installed (Docker 29.9.1). Neon gives testers a hosted DB behind a public Vercel URL. Same `pg` driver for both; switching is `DATABASE_URL` + `CREATE EXTENSION vector` + `drizzle-kit push` + reseed. |
| Vercel (Hobby) | n/a | Hosting for user testing | `git push` = deploy, Marketplace Neon integration injects `DATABASE_URL`. The demo itself runs from `next start` on the laptop against Docker. Before sharing the link: set an Anthropic spend limit and `maxDuration = 60` on AI routes. |

### Claude usage (models and API surface)

| Use | Model ID | Why |
|-----|----------|-----|
| Runtime AI (matcher rerank+reasons, timetable extraction) | `claude-sonnet-5-5` ($2 / $10 per MTok, 1M ctx) | Fast + cheap enough that a whole demo costs cents; vision/PDF capable. Put the ID in `CLAUDE_MODEL` env var so it can be swapped in one place. |
| Offline ingestion scripts (catalogue/study-plan PDF -> JSON) and quality fallback for timetable extraction | `claude-opus-5-5` ($4 / $20) | No latency pressure offline; best accuracy on messy Romanian/English tables. Flip the runtime extractor to it if Sonnet misreads a real UPT timetable. |
- **Structured output = `client.messages.parse({ ..., output_config: { format: zodOutputFormat(Schema) } })`**, then read `response.parsed_output` (null if parse failed - guard it). Do NOT use the deprecated `output_format` param.
- **Do NOT use forced `tool_choice` (`any`/`tool`)** - returns HTTP 400 on Sonnet 5.5 and Opus 5.5. Structured outputs replace the "force a tool to get JSON" trick; tool use is not needed anywhere in this app.
- **No `temperature`/`top_p`/`top_k`** on these models (non-default values 400). No assistant prefill (400).
- **Thinking is on by default** (adaptive). Control latency with `output_config: { effort: "low" | "medium" | "high" }` - start matcher at `low`, extractor at `medium`. Never send `thinking: {type:"disabled"}` (400 on both models). Opus 5.5 defaults to `medium` effort, Sonnet 5.5 to `high`: set it explicitly.
- **PDF input:** content block `{ type: "document", source: { type: "base64", media_type: "application/pdf", data } }` placed BEFORE the text block. Limits 32 MB request / 600 pages. **Images:** `{ type: "image", source: { type: "base64", media_type: "image/png", data } }`. Pasted text is just a text block. One extractor function, three input kinds.
- **Citations (stretch RAG chatbot) are incompatible with `output_config.format`** (400). The chatbot must use plain text + citations on `document` blocks, not structured output.
- Check `stop_reason === "refusal"` before reading content. The skill suggests opting into server-side `fallbacks` for Sonnet 5.5 (beta header `server-side-fallback-2026-07-01`); optional for a demo - handle the refusal path with a friendly error instead (MEDIUM).
- Prompt caching: for the Plan-B matcher below, put the catalogue in `system` with `cache_control` (top-level auto caching) - cache reads are $0.10/MTok on Sonnet 5.5.

### Database / vector search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Neon Postgres + pgvector | extension `vector` | Course embeddings + user data in one DB | Course count is hundreds to low thousands (not 100k): any approach works, so pick the one with the fewest moving parts. Query is one line: `ORDER BY embedding <=> $queryVec LIMIT 20`. |
| pg (node-postgres) | 8.23.1 (+ `@types/pg` 8.23.1) | Driver | Pure JS, works with Neon's pooled connection string, supports transactions (the `neon-http` driver does not). Drizzle `drizzle-orm/node-postgres`. |

### Embeddings

| Option | Version | Verdict |
|--------|---------|---------|
| **Voyage AI `voyage-4`** via plain `fetch` to `POST https://api.voyageai.com/v1/embeddings` | model `voyage-4` (family: `voyage-4-large`, `voyage-4`, `voyage-4-lite`) | **Recommended.** Voyage is the embedding provider Anthropic points to (Claude has no embeddings endpoint). Verified on docs.voyageai.com: 32,000-token context, dims 256/512/1024(default)/2048, multilingual positioning, `input_type: "document" | "query"`, `output_dimension`. First 200M tokens free per account on the 4-series (MEDIUM - from Voyage pricing page excerpt; third-party listings put voyage-4 at ~$0.06/M). Use 1024 dims (default), `input_type: "document"` when seeding, `"query"` at match time. Needs one extra API key + signup (~5 min). Plain `fetch` is 10 lines; skip the `voyageai` npm package (0.6.0) to avoid SDK shape risk. |
| **Plan B: no embeddings at all - Claude over the whole catalogue** | `claude-sonnet-5-5` + prompt caching | **Use if the Voyage key is not in hand by Friday night.** Serialize the catalogue compactly (`id | name | ECTS | sem | faculty | english`, ~60-80 tokens/course; 1,500 courses ~ 100-120k tokens, fits the 1M window), cache it in `system`, and ask Claude to return the top-N matches with score + reason via `zodOutputFormat`. Single vendor, no vector code, quality is arguably higher than cosine. Cost: cached reads $0.10/MTok; latency higher on a cold cache (warm it once before the demo with a `max_tokens: 0`-style pre-warm or a dummy call). |
| Local embeddings (`@huggingface/transformers` 4.3.2, `fastembed` 3.0.0) | - | **Do not use.** ONNX runtime + model download (100s of MB) on every serverless cold start, native deps (`onnxruntime-node`, `sharp`) on Windows. Costs hours, saves cents. |
| OpenAI embeddings (`openai` 7.62.0) | - | Works, but adds a second AI vendor for no benefit over Voyage. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.3.5 | Styling | Default in `create-next-app`; shadcn requires it. |
| shadcn/ui CLI | 4.23.0 (`npx shadcn@latest init`) | Copy-in accessible components (Button, Card, Dialog, Tabs, Checkbox, Table, Badge, Sheet, Progress, Select) | Responsive UI with zero design time. Components live in your repo, so the agent can edit them freely. |
| lucide-react | 1.77.0 | Icons | shadcn default. |
| sonner | 2.0.8 | Toasts | shadcn `sonner` component. |
| tw-animate-css | 1.4.0 | Animations used by shadcn | Pulled in by `shadcn init`. |
| react-hook-form | 7.92.0 | Forms | Only for the multi-field "add home course" form if it grows; plain controlled inputs are fine for the 4-question onboarding. Optional. |
| cheerio | 1.2.0 | HTML parsing in ingestion scripts (faculty pages, study plans) | Offline scripts only. Use with Node's built-in `fetch`. |
| pdf-lib | 1.17.1 | Split a big PDF into page ranges before sending to Claude | Only if the Erasmus catalogue PDF exceeds ~100 pages or a single call is too slow/large. Unmaintained but stable and pure JS. |
| ical-generator | 11.1.4 (needs Node 22 or >=24) | `.ics` export | See ICS notes below. Verified it imports and emits events on Node 24. |
| date-fns | 4.4.0 | Week/parity date math, semester date expansion | Conflict detection + occurrence expansion. Skip `date-fns-tz`; see ICS notes. |
| tsx | 4.23.15 | Run TS ingestion/seed scripts (`npx tsx scripts/ingest.ts`) | Offline scripts. |
| vitest | 5.1.1 | One small test file for the pure conflict/parity/ics logic | Only for `schedule-core` (overlap + odd/even parity + .ics output). That is the one place a silent bug embarrasses you live. |
| dotenv-less | - | Next loads `.env.local` natively | For `tsx` scripts use `node --env-file=.env.local` (Node 24) or `tsx --env-file=.env.local`; no dotenv package needed. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `drizzle-kit push` | Apply schema straight to Neon | Skip migration files for a 2-day build (`shortcut: no migration history, adopt `generate`+`migrate` after the demo`). |
| `npx auth@latest generate` | Generate Better Auth tables as Drizzle schema | Documented command; paste output into `schema.ts`, then `drizzle-kit push`. |
| Vercel CLI or GitHub import | Deploy | GitHub import is fastest; install Neon from Vercel Marketplace for the testing deploy. Local dev keeps its Docker `DATABASE_URL` in `.env.local` (do not `vercel env pull` over it). |

## Ingestion strategy (PDF/HTML -> seed data)

## ICS and schedule logic notes (verified experimentally)

- **Recommended approach: expand occurrences in code and emit one non-recurring event per occurrence**, using the same expansion function (`weeks -> concrete dates`, with odd/even parity) that conflict detection uses. This avoids RRULE `INTERVAL=2` parity bugs and avoids needing a VTIMEZONE block. Semester is ~14 weeks x a handful of slots = well under 300 events.
- **Gotcha, verified on this machine (HIGH):** `ical-generator` with `floating: true` writes the Date's **UTC** components as the wall-clock time. Pass `new Date("2026-10-05T08:00:00Z")` to get `DTSTART:20261005T080000`. Passing `new Date("2026-10-05T08:00:00")` (local) on a Bucharest machine produced `050000` (wrong), and `timezone: "Europe/Bucharest"` with a "Z" date shifted to `110000` (wrong). Build wall-time dates as UTC-labelled and use `floating: true`; the student's calendar shows the correct local time in Timisoara. Also remember Vercel runs in UTC, so never construct dates with a local-time string on the server.
- `ics` (3.12.1) is the alternative; it works, but `ical-generator` has the nicer builder API and `toString()`. Either is fine; do not spend time comparing. Serve via a Route Handler with `Content-Type: text/calendar; charset=utf-8` and `Content-Disposition: attachment; filename="erasmus-upt.ics"`.
- Import the output into Google Calendar and Outlook once before the demo.

## Installation

# Scaffold (answer: TypeScript, Tailwind, App Router, no src dir optional, Turbopack default)

# Core

# UI (shadcn pulls Tailwind animate + lucide; then add components as needed)

# Dev dependencies

# Ingestion-only (offline scripts)

# Env (.env.local)

# ANTHROPIC_API_KEY=...   VOYAGE_API_KEY=...   DATABASE_URL=...(Docker locally; Neon pooled on Vercel)   BETTER_AUTH_SECRET=...   BETTER_AUTH_URL=http://localhost:3000

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 single deploy | Vite SPA + Express/Hono API | Only if the team strongly prefers it; costs two build targets and CORS/cookie setup for no gain. |
| Next.js (TS) | FastAPI + React | Never here: no Python installed, two deploys, two languages. |
| Neon Postgres + pgvector | SQLite (`@libsql/client` 0.18.0) + in-memory vectors | If Neon signup stalls: libsql file DB works locally with zero setup, but prod hosting then needs Turso (docs are mid-transition to `@tursodatabase/*` SDKs - drift risk) or a persistent-disk host. |
| Neon + Better Auth | Supabase (auth + pgvector + DB in one) | Reasonable all-in-one if you already have a Supabase project; costs dashboard config, RLS and a different client SDK. |
| Better Auth | Clerk | Fastest if you accept a hosted dashboard, keys and branded UI; vendor lock-in and redirect flows are poor for a demo you want to control. |
| Better Auth | Auth.js / NextAuth | Do not start new projects on it; Better Auth is its successor path. |
| Drizzle | Prisma | Extra `generate` step and engine binaries; no benefit in 2 days. |
| Voyage `voyage-4` | Claude-over-full-catalogue (Plan B) | When the catalogue fits comfortably in context and you want zero vector infra / zero extra key. Switch to embeddings only if latency or cost per match matters. |
| Direct Anthropic SDK | Vercel AI SDK / LangChain | Adds a provider abstraction and a second API surface to learn; this app is 3 single-shot structured calls with no streaming chat. |
| Hand-written CSS-grid week view | FullCalendar / react-big-calendar | Only if you need drag-drop. A 7-column grid keyed by day/hour is ~100 lines and responsive. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Local embedding models (transformers.js, fastembed, onnxruntime) | Native deps + large model download + cold-start cost; hours of setup | Voyage API (or Plan B) |
| sqlite-vec / better-sqlite3 (13.2.0) | Native addons; vec extension loading breaks on Vercel/Windows; SQLite cannot persist on Vercel | pgvector on Neon |
| Pinecone/Weaviate/Qdrant or any standalone vector DB | New account + SDK for a catalogue that fits in memory | pgvector (or in-memory) |
| LangChain / LlamaIndex | Abstraction tax; hides the few API details you must control (structured outputs, PDF blocks) | `@anthropic-ai/sdk` directly |
| `pdf-parse`, `pdfjs-dist`, `unpdf` for catalogue/timetable extraction | Plain text extraction destroys table layout; `unpdf` also needs `@napi-rs/canvas`. Claude reads the PDF natively | Claude `document` block + Zod schema |
| Runtime scraping of upt.ro | Flaky, slow, may break mid-demo (project constraint) | Committed seed JSON |
| Forced `tool_choice` / tool-use-for-JSON | 400 on Sonnet 5.5 / Opus 5.5 | `messages.parse` + `zodOutputFormat` |
| `temperature`, prefill, `thinking: {type:"enabled", budget_tokens}` | 400 on current models | `output_config.effort` |
| `ics`/`ical-generator` RRULE for odd/even weeks | Parity math + timezone rendering errors are invisible until a client imports the file | Expand to explicit occurrences, floating times |
| Email verification / password reset flows | Needs an email provider (extra account, DNS) | Off for the demo; document as post-demo work |
| Mobile-oriented stack (React Native, PWA tooling, shared API contract) | Out of scope (colleague owns mobile) | Responsive Tailwind layout only |
| UPT SSO | Students lack credentials | Own accounts |

## Stack Patterns by Variant

- Use Plan B (Claude ranks over the cached full catalogue). Drop the `embedding` column and the seed embedding step; the Module 1 contract (ranked list with score, reason, metadata from DB row) is unchanged, so UI work is not affected.
- Switch to local `@libsql/client` file DB with `drizzle-orm/libsql` and the in-memory vector fallback; demo from the laptop via `next start`. Better Auth provider becomes `"sqlite"`.
- Set effort `low`, stream is unnecessary; show a progress state, and ship a pre-extracted sample result behind a "Try sample timetable" button so the schedule/conflict/.ics modules can always be demoed.
- Serverless request bodies are capped (~4.5 MB, MEDIUM); downscale screenshots client-side (canvas -> JPEG) before posting and keep PDFs small. Set `export const maxDuration = 60` on the extraction route.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.4.6 | react@19.3.1, node >=20.9 | Better Auth peer range includes `next ^16`. |
| better-auth@1.7.27 | @better-auth/drizzle-adapter@1.7.27, drizzle-orm ^0.45.2, drizzle-kit >=0.31.4 | Keep adapter and core on the same version. |
| drizzle-orm@0.45.4 | pg >=8, @types/pg | `drizzle-orm/node-postgres`. |
| @anthropic-ai/sdk@1.12.0 | zod ^3.25 or ^4 | `helpers/zod` import verified with zod 4.6.7. |
| ical-generator@11.1.4 | Node 22 or >=24 | Set Vercel project Node to 22.x/24.x (not 20). |
| shadcn@4.23.0 | Tailwind 4.3.5 | `create-next-app` defaults configure Tailwind; run `shadcn init` after scaffold. |

## Confidence per recommendation

| Recommendation | Confidence | Basis |
|----------------|------------|-------|
| Next 16 + TS single deploy | HIGH | npm versions verified, Better Auth Next 16 docs |
| Anthropic SDK structured output / PDF / image usage | HIGH | Current official Claude API skill docs + verified `zodOutputFormat` export at runtime |
| Model IDs `claude-sonnet-5-5` / `claude-opus-5-5` and no forced tool_choice | HIGH | Current Claude API reference (cached 2026-11-03) |
| Better Auth + Drizzle (pg) | HIGH | Official docs fetched; imports verified |
| Neon + pgvector via Vercel Marketplace | MEDIUM-HIGH | Search results from Neon/Vercel docs; not exercised here |
| Voyage `voyage-4` params/dims/context | HIGH (params), MEDIUM (free tier/price) | docs.voyageai.com fetched; price from search excerpts |
| Plan B (Claude over full catalogue) | MEDIUM | Sound arithmetic + documented caching; latency not measured |
| ical-generator floating-time behavior | HIGH | Reproduced locally on Node 24 |
| Vercel body-size/maxDuration limits | MEDIUM | From memory, verify in Vercel docs at deploy time |
| shadcn/Tailwind 4 init flow | MEDIUM-HIGH | Official docs fetched (version of Tailwind not stated there) |

## Sources

- Claude API skill reference (bundled, cached 2026-11-03): model IDs/pricing, `messages.parse` + `zodOutputFormat`, PDF/image blocks, forced-tool-choice removal, thinking/effort rules, citations vs structured output - HIGH
- https://docs.voyageai.com/docs/embeddings - voyage-4 family, dims, context length, REST body - HIGH
- https://docs.voyageai.com/pricing (via search) - free tokens for 4-series - MEDIUM
- https://www.better-auth.com/docs/integrations/next - route handler, `nextCookies`, `proxy.ts` - HIGH
- https://www.better-auth.com/docs/adapters/drizzle - `drizzleAdapter`, `npx auth@latest generate`, drizzle-kit flow - HIGH
- https://ui.shadcn.com/docs/installation/next - shadcn init/add commands - MEDIUM-HIGH
- https://neon.com/docs/extensions/pgvector and https://vercel.com/marketplace/neon (via search) - pgvector on all plans, Vercel Marketplace Postgres replaces Vercel Postgres - MEDIUM
- `npm view` for all package versions (2026-11-20) and local smoke tests of `@anthropic-ai/sdk/helpers/zod`, `@better-auth/drizzle-adapter`, `ical-generator` on Node 24.19 - HIGH

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| impeccable | "Use to design, redesign, critique, audit, polish or animate a frontend: websites, landing pages, dashboards, app UI, components, native iOS/Android screens, or a design system (DESIGN.md)." | `.claude/skills/impeccable/SKILL.md` |
| karpathy-guidelines | Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria. | `.claude/skills/karpathy-guidelines/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
