# Walking Skeleton — Erasmus@UPT

**Phase:** 1
**Generated:** 2026-11-21

## Capability Proven End-to-End

A visitor signs up with email and password, lands on the Matcher page that greets them by name (read back from Postgres through Better Auth), closes the browser, reopens it and is still signed in; an unauthenticated request to any app page is redirected to `/sign-in`.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.4.6 App Router, TypeScript, `src/` dir, Turbopack, Node 24 | Fixed by `.claude/CLAUDE.md`. One deploy, pages + route handlers in one repo. `proxy.ts` replaces `middleware.ts` in Next 16. |
| Scaffold method | `create-next-app@16.4.6` into a temp dir outside the repo, then copy in | The repo root already holds `README.md`, `.planning/`, `.claude/`, `data/`, which make `create-next-app .` refuse to run. |
| Data layer | Postgres 17 + pgvector (`pgvector/pgvector:pg17`) in Docker Compose, host port 5433; Drizzle ORM 0.45.4 over `pg` 8.23.1; `drizzle-kit push --force` (no migration files) | Offline, resettable laptop DB (CLAUDE.md). Port 5433 avoids clashing with a locally installed Postgres. Neon later = change `DATABASE_URL`, run `npm run db:push`, reseed. |
| Schema ownership | One file, `src/db/schema.ts`, holds every table for Phase 1 (auth + catalogue + user-scoped). Plan 01-01 writes it in full and pushes it once. | Later Phase 1 plans run in parallel; a single schema author avoids file conflicts. A later plan that needs a column edits this file and reruns `npm run db:push` as a [BLOCKING] step. |
| Catalogue identity | Surrogate text id `<FACULTY>-<B|M>-<sheetRow>` (e.g. `AC-B-12`); `code` is non-unique and only indexed | Only AC is imported for now (D-17) and its 204 codes are unique, but 102 codes repeat across the deferred faculties (RESEARCH Pitfall 1); the surrogate keeps saved LA rows valid when they return. |
| Scope | AC students and AC courses only (Phase 1 CONTEXT D-17): one catalogue file, one faculty row, one coordinator, no faculty filter | User decision 2026-11-21; other faculties are deferred, not deleted. |
| Auth | Better Auth 1.7.27, email + password, Drizzle adapter (`@better-auth/drizzle-adapter`), `nextCookies()` last plugin, persistent session cookie | Fixed by CLAUDE.md; library in the repo, no external dashboard. D-10: the whole app requires an account. |
| Authorization | `src/proxy.ts` does a cookie-presence redirect only; every page calls `requireUser()` and every route handler calls `getSessionUser()` and returns 401 | Better Auth docs: the proxy cookie check is not a security check. |
| Identity key | Better Auth `user.id` (text). Every user-scoped table (`profile`, `home_course`, `la_item`) keys on it with `ON DELETE CASCADE` | No anonymous mode (D-10). |
| LA semester | `la_item` stores no semester or season; Winter/Summer always comes from the course row's catalogue semester | D-12 clarified 2026-11-21: placement is catalogue-derived and locked. |
| AI provider | `@anthropic-ai/sdk` 1.12.0, `client.messages.parse` + `zodOutputFormat`, `output_config.effort` set explicitly, refusal guard; model ids from env `CLAUDE_MODEL` (`claude-sonnet-5-5`) and `CLAUDE_INGEST_MODEL` (`claude-opus-5-5`) | CLAUDE.md API rules. No tool use, no temperature, no prefill. |
| Matching | One Claude call ranks/explains over the prompt-cached AC catalogue block for the active semester filter (1h TTL; courses with a fișă carry their topics); ids validated in code; every fact joined from the DB | No Voyage key; 204 AC rows (D-17) fit in one cached call, so no shortlist stage. A shortlist (Voyage + pgvector or Claude) can go in front of `rankForInput` if the catalogue grows again. |
| UI | Port the prototype's CSS (`prototype/index.html`) into `src/app/globals.css` with `COLOR-GUIDE.md` token names as CSS custom properties, mapped into Tailwind 4 `@theme`; Public Sans + Red Hat Mono via `next/font/google` (fetched once at `next build`, which already needs network for `npm i` and the Docker pull; self-hosted from `.next` at runtime, so `next start` makes no font request). No shadcn init in Phase 1. | The prototype is the UI-exact reference; porting its classes is faster and more faithful than restyling shadcn components. Reversible. |
| Business logic placement | `src/domain/` (pure, vitest-tested), `src/services/` (orchestration, DB + Claude), thin `src/app/api/**/route.ts` handlers | Future mobile app reuses the same backend (CLAUDE.md). |
| Offline data | `scripts/*.ts` run with `npx tsx --env-file=.env.local`; outputs committed under `data/seed/` | No runtime scraping (CLAUDE.md). |
| Smoke checks | `scripts/lib/with-server.ts` starts `next start` on :3000, waits, runs a check, kills the process tree; each slice adds a `scripts/smoke-*.ts` | Gives every plan a self-contained automated end-to-end verify. |
| Deployment target | Local `next start` on the laptop against Docker Postgres (demo). Vercel + Neon only for later user testing. | CLAUDE.md constraint. |
| Directory layout | `src/app/(auth)/sign-in`, `src/app/(auth)/sign-up`, `src/app/(app)/{matcher,catalogue,la,la/print,syllabus/[courseId]}`, `src/app/api/**`, `src/db`, `src/lib`, `src/domain`, `src/services`, `src/llm`, `scripts/`, `data/seed/`, `data/golden/` | RESEARCH "Recommended Project Structure". |

## Stack Touched in Phase 1

- [ ] Project scaffold (Next 16, TypeScript, ESLint, Tailwind 4, vitest)
- [ ] Routing: `/sign-up`, `/sign-in`, `/matcher` (+ `/` redirects to `/matcher`)
- [ ] Database: write (sign-up inserts `user` + `account` + `session`) and read (session lookup returns the user's name)
- [ ] UI: sign-up form wired to `POST /api/auth/sign-up/email`; sign-out button
- [ ] Deployment: documented local full-stack run: `npm run db:up && npm run db:push && npm run build && npm run start`

## Out of Scope (Deferred to Later Slices)

- Password reset and email verification (need an email provider; post-demo)
- Anonymous mode and anonymous-to-account migration (D-10). The roadmap's anonymous-cookie fallback is not built; it is only an emergency path if Better Auth blows its 45-min time box.
- Voyage embeddings + pgvector similarity (the `vector` extension is created but unused)
- shadcn/ui components
- Hosted deployment (PLAT-V2-02), documented mobile API (PLAT-V2-01)
- Checklist / Schedule / Map nav items (Phases 2-4 add them)

## Subsequent Slice Plan

Each later slice adds one vertical capability on top of this skeleton without changing the decisions above:

- Plan 01-02: browse the imported AC courses of the 2026-27 Erasmus catalogue with filters
- Plan 01-03: type a home course and get ranked, explained AC matches (one Claude call over the cached catalogue) + AC golden-set gate
- Plan 01-04: the full Matcher (saved courses, per-course loading, semester filter, upload a syllabus to pre-fill)
- Plan 01-05: Learning Agreement draft panel (semester locked to the catalogue), full draft, CSV and printable view
- Plan 01-06: syllabus-to-syllabus comparison from collected AC fișe disciplinei (main path for criterion 3)
- Later (v2): other faculties (D-17 deferred list)
- Phase 2: arrival checklist; Phase 3: schedule builder; Phase 4: campus map
