# 01-03 handoff (paused 2026-11-21)

Branch `phase-1/01-02-01-03-catalogue-matcher`. Work was paused by the user after both task commits.

## Done (committed)
- `12c686c` Task 1: name mode (D-19) + topic mode (D-20: Gemini inferred topics, gemini-embedding-2 768-dim embeddings, pgvector), `/api/home-courses`, `/api/matches`, match card, Matcher page, `smoke:match`.
- `602a9ee` Task 2: golden set (12 + 2) and `npm run golden [-- --topics]`. Commit message reports name mode 12/12, topic mode 12/12, negatives Weak; topic score mapping cosine 0.62 -> 0, 0.88 -> 100.
- DB state at pause: 204/204 courses have topics and embeddings.

## Left to do on resume
1. Re-verify (the run that produced the numbers above was not observed by the orchestrator): `npx vitest run`, `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run smoke:match`, `npm run smoke:catalogue`, `npm run smoke:auth`, `npm run golden`, `npm run golden -- --topics`. Port 3000 must be free.
2. Check the name-mode 12/12 for overfitting: D-19 forbids tuning the synonym map to the golden set. Read `src/domain/normalise.ts` and compare its synonyms with the golden case names.
3. Write `01-03-SUMMARY.md` (template `.claude/gsd-core/templates/summary.md`, same shape as `01-02-SUMMARY.md`) with both golden printouts, the score mapping, whether `taskType` worked for the embed model, deviations and open human checks; commit as `docs(01-03): plan summary`; delete this handoff file in the same commit.
