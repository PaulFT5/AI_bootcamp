# Erasmus@UPT

English-first web assistant for incoming Erasmus+ students at Politehnica University of Timișoara: course matching for the Learning Agreement, a paperwork checklist, a schedule builder and a campus map.

**Current scope:** students hosted by the Faculty of Automation and Computers (AC) and AC courses only. Other faculties come later (see "Deferred: other faculties" in `.planning/ROADMAP.md`).

Read first: `PRODUCT.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`.

## Setup

1. Install Git, Node 24, and Docker Desktop (keep it running; the database is Postgres + pgvector in Docker).
2. If you use Claude Code, install GSD once after cloning (it writes paths for your machine, so it is not committed):
   ```
   npx -y @opengsd/gsd-core@latest --claude --local
   ```
   Then run `/gsd-progress` to check it works. The Impeccable skill and the plugins in `.claude/settings.json` come with the repo.
3. Create `.env.local` in the project root (never commit it):
   ```
   ANTHROPIC_API_KEY=...        # your own key, with a spend limit set
   VOYAGE_API_KEY=...           # only if embeddings are used
   DATABASE_URL=postgres://...  # local Docker URL
   BETTER_AUTH_SECRET=...       # any long random string
   BETTER_AUTH_URL=http://localhost:3000
   ```

App run commands will be added here once Phase 1 sets up the project.

## Workflow

One branch per phase or task, merged via pull requests. In Claude Code, start work through a GSD command.
