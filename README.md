# Erasmus@UPT

English-first web assistant for incoming Erasmus+ students at Politehnica University of Timișoara: course matching for the Learning Agreement, a paperwork checklist, a schedule builder and a campus map.

**Current scope:** students hosted by the Faculty of Automation and Computers (AC) and AC courses only. Other faculties come later (see "Deferred: other faculties" in `.planning/ROADMAP.md`).

Read first: `PRODUCT.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`.

## Start here: the app (not the prototype)

The product is the **Next.js app in `src/`**. Change features there.

`prototype/index.html` is the original clickable mock with invented sample data. It is the visual reference only: the app copies its look (classes ported into `src/app/globals.css`), but nothing in the prototype reaches users. Do not add features to it.

Where things live:

| Area | Pages | Data / logic |
|---|---|---|
| Course matcher | `src/app/(app)/matcher/` | `src/services/matcher.ts`, `src/domain/`, `src/llm/gemini.ts` |
| Catalogue (204 AC courses) | `src/app/(app)/catalogue/` | `src/services/catalogue.ts`, `data/seed/catalogue.json` |
| Learning Agreement draft | `src/app/(app)/la/` | `src/services/la.ts`, `src/domain/csv.ts`, `src/domain/ects.ts` |
| Resources (visa, residence, embassies, offices) | `src/app/(app)/resources/` | `src/content/resources.ts` |
| First week (days, who to ask, buildings, rooms) | `src/app/(app)/first-week/` | `src/content/first-week.ts` |
| Sidebar | `src/components/top-bar.tsx` (`NAV`) | |
| Database schema | | `src/db/schema.ts` |

To change Resources or First week text, edit `src/content/resources.ts` or `src/content/first-week.ts` (ported verbatim from the prototype tabs on branch `resources-tab`). Keep every fact sourced from an official UPT page and keep its source link.

Colours and type are documented in `COLOR-GUIDE.md`. The folders `.impeccable/mocks/colors/` and `.impeccable/mocks/decision/` are archived design explorations.

## Setup

1. Install Git, Node 24, and Docker Desktop (keep it running; the database is Postgres + pgvector in Docker).
2. If you use Claude Code, install GSD once after cloning (it writes paths for your machine, so it is not committed):
   ```
   npx -y @opengsd/gsd-core@latest --claude --local
   ```
   Then run `/gsd-progress` to check it works. The Impeccable skill and the plugins in `.claude/settings.json` come with the repo.
3. Create `.env.local` in the project root (never commit it; `.env.example` lists the names):
   ```
   DATABASE_URL=postgres://erasmus:erasmus@localhost:5433/erasmus
   GEMINI_API_KEY=...            # your own Gemini API key (free tier works)
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_EMBED_MODEL=gemini-embedding-2
   ```
4. Install, start the database, create tables, load the catalogue, run:
   ```
   npm install
   npm run db:up
   npm run db:push
   npm run db:seed
   npm run embed:courses        # once: topic embeddings for the 204 courses (uses Gemini)
   npm run build
   npm run start                # http://localhost:3000
   ```
   For development use `npm run dev` instead of build + start.

Checks: `npm test`, `npm run lint`, and the end-to-end smoke scripts (`npm run smoke:auth`, `smoke:catalogue`, `smoke:matcher`, `smoke:la`; they need port 3000 free and a prior `npm run build`).

## Workflow

One branch per phase or task, merged via pull requests. In Claude Code, start work through a GSD command.
