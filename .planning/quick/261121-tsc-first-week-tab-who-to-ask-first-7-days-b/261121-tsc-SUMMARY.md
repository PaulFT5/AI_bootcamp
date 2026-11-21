---
phase: quick-261121-tsc
plan: 01
subsystem: ui
tags: [prototype, first-week, a11y, vanilla-js]
requires: [quick-261121-su9, quick-261121-rpc]
provides:
  - "First week tab in prototype/index.html: First 7 days, Who to ask, Buildings, Where is my room?, Your classes by building"
affects: [prototype]
actuals:
  tokens: 14000
  tasks: 3
  commits: 0
plan_head_before: 77edd2f4eda918351ae8ca3ab024e46431d4f40a
plan_head_after: 77edd2f4eda918351ae8ca3ab024e46431d4f40a
tech-stack:
  added: []
  patterns: ["Second MutationObserver restores only its own banner sentence", "Null-prototype lower-cased index for exact, case-insensitive room lookup"]
key-files:
  created: []
  modified: [prototype/index.html]
key-decisions:
  - "Room lookup is exact on the whole code and case-insensitive through a lower-cased index of rooms.table keys (orchestrator override of plan decision 3); the displayed code is the key as stored"
  - "Buildings are lists inside one panel per group, not a card per building"
requirements-completed: [QUICK-261121-tsc]
status: complete
---

# Phase quick-261121-tsc Plan 01: First week tab Summary

First week tab in the single-file prototype: five sections (First 7 days disclosure cards, Who to ask office cards, Buildings list with one official-map link, Where is my room? exact lookup, Your classes by building from SAMPLE classes), all rendered from the embedded `FIRSTWEEK_DATA`, with Maps links only (no embedded map) and a First-week-only banner sentence.

`commits: 0` is intentional: the user chose no commits. All changes are uncommitted on `resources-tab` (`M prototype/index.html`), HEAD is still 77edd2f, nothing staged.

## What was done

- Task 1 (tracer): embedded the data with `fw-final/inject-block.mjs` (`firstweek-data` markers), removed only the First week soon badge, replaced the stub with the First week markup, added the `/* first week */` CSS block, the first-week JS (`renderFirstWeek`, `fwMaps`, banner observer) and `renderFirstWeek();` at init. Harness extended with (fw1)-(fw7), (fwz1)-(fwz2).
- Task 2 (RED then GREEN): wrote (fw8), (fw9), (fw5b), (fwz3) first; RED run failed as expected (`#fwRoomForm` missing, 4 FAIL lines incl. a harness exception); then added the room form, lookup and class groups, and the harness passed.
- Task 3: (fw11)-(fw13), real-key checks, screenshots (one fix batch), diff gate, HEAD gate.

## Verification (what was run)

- `check-block.mjs` (the orchestrator-fixed original, no separate copy made): `EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses`. `check-embed.mjs`: `EMBED OK steps=10 countries=38`. Both run after the last edit. No data value was typed or edited.
- `harness.mjs`: **HARNESS 316/316**, exit 0 (previous total at the end of su9 was 231). 150 checks at 1440 and 150 at 390, plus persist runs and the (v) snapshot checks. Console errors and warnings 0 in the full and persist runs.
- Three pre-existing checks were re-scoped on purpose: (a) badges (no soon badge on Resources or First week; Home page and Schedule keep theirs), (z2) loop skips First week (covered by (fwz1)/(fwz2)), (v) First week (HEAD is the stub, work tree contains the First week UI; the other views are still byte-identical to HEAD).
- `cdp-keys.mjs` (real key events): **32/32 at 1440 and 32/32 at 390** (was 23/23). New: typing `b426` + Enter shows the derived building line, Wing: Corp B, Floor: 4, Room: B426 and focus stays on `#fwRoom`; `Z999` shows Not in our map yet; Tab from the empty input reaches Search and Enter asks for a code; Enter/Space opens/closes First 7 days header `fwh-0` with a solid outline of at least 2px; Enter on a class row shows its room.
- Derived counts quoted from the check names: 7 First 7 days cards (2 where blocks, 3 action buttons, 6 sources); 6 office cards (tel 4, mailto 3, Maps 4); Buildings Faculties=7, Services=5, Student residences=2 (14 buildings, 14 Maps links); 7 sample classes in 2 groups (Electro building=6, Chemistry faculty building=1); 29 Maps links in First week with the room result empty ((fw5b): 4 offices + 2 First 7 days where blocks + 14 buildings + 2 class groups + 7 class rooms); tel hrefs 4, mailto hrefs 4 (3 offices plus the notice link). Contrast (fw13): 411 elements all at least 4.5:1, placeholder 4.93:1. No horizontal scroll at 390 (fw11). Targets at least 44x44 (fw12).
- Room search (fw8): A117 = electro/A/1, B426 = electro/B/4, C303 = chemistry/C/3, B019 = Floor 0 (ground floor); `b426`, ` B 426 `, `a117`, `c303` found; `B129b` found as typed, as `B129B` and as `b129b` and shown as stored; `Z999`, `A5`, `__proto__`, `constructor`, `toString` and a markup string show the exact not-found sentence plus the official map link with no exception and no injected markup; empty and spaces-only ask for a code.
- Action buttons (fwz3): each of the 3 actions opens its view, hides First week, and the banner follows (Resources sentence on Resources, original on Courses).
- Banner: exact D-08 sentence on First week (textContent and innerText); Resources keeps its own on First week to Resources; original `.data-note` innerHTML restored byte for byte on Courses, Settings and Catalogue. Mechanism: a second MutationObserver created after the Resources one; `fwBanner` restores only when the text equals its own sentence, reusing `resNoteHtml0` read-only. No existing line was edited (showView, delegate, `.data-note` markup, resBanner untouched).
- Diff gate against `index.before-fw.html` (fw mode, extended `diff-gate.mjs`): `DIFFGATE OK hunks=6`: css 1, nav 1, stub 1, data 1, js 1, init 1. A mutated copy (a trailing comment on the `showView` line) printed `DIFFGATE FAIL ... OUTSIDE`, so the gate does catch stray edits.
- HEAD gate: `git diff -U0 prototype/index.html` removes exactly 4 lines (the Resources nav and stub, the First week nav and stub), no others. HEAD is 77edd2f, `git rev-list --count 77edd2f..HEAD` is 0, 0 staged files.
- Grep gates (data lines excluded): soon badge on First week 0, on Home page 1, on Schedule 1; `/* first week */` 1; `new MutationObserver` 2; `id="fwRoom"` 1; aria-live result region 1; `hasOwnProperty` 1; `fw-sample` 3.
- Screenshots (impeccable shot at 1440x900 and 390x844, full page, plus per-section pages because the full-page images were too tall to read) were read: days (open cards), Who to ask (open Source), Buildings, room result, classes. One fix batch: (1) class rows were ragged at 390 (the time, course and Sample badge wrapped differently per row), so the row is now a grid (time and Sample on line 1, course and room on line 2, chevron right); (2) the page-tag (`Guide p. N`) sat low beside the Source button, so it is now centred in the actions row. Re-shot the classes and Who to ask sections at 390 and read them: both fixed. The 1440 classes section was not re-shot after the grid change (the 1440 image read was from before it).

## Deviations from Plan

### Orchestrator overrides (not auto-fixes)

**1. Room lookup is case-insensitive on the whole code** (plan decision 3 overridden). `fwNorm` removes whitespace and lower-cases; a null-prototype index of lower-cased `rooms.table` keys is built once. Exact match only, no partial or fuzzy matching, displayed code is the stored key. Harness (fw8) tests this.

**2. No `check-block-fixed.mjs` copy.** The orchestrator had already fixed `fw-final/check-block.mjs`; the original was used directly. Plan Task 1 items about creating a fixed copy and `fix-cb.mjs` were skipped.

**3. No commits** (D-10 and the orchestrator constraint); `git add`, `commit`, `stash`, `checkout` were never run.

### Auto-fixed

None beyond the screenshot fix batch above (layout only, inside the First week CSS block).

## Data observations (no data changed)

- `A5` (the AC Bachelor secretariat room named in Who to ask) is not a key in `rooms.table`, so it reads "Not in our map yet" with the official map link.
- The key `B129b` has a lower-case suffix; with the case-insensitive override `B129B` and `b129b` are found.
- The roomBuilding source quotes are in Romanian, with English notes (shown as stored).
- The airport-border and student-certificate offices have no Maps link or email by design (fields omitted, not invented).

## What was NOT verified

- A human browser pass at laptop and phone width (still open): open First week, search B426 and Z999, open a First 7 days card, a Source disclosure and a class row, tap one Open in Maps link, check the banner on First week and Resources.
- Opening a Maps link in Google Maps (only the href format was verified).
- Whether web fonts loaded in headless runs.
- The 1440 classes layout after the grid change (not re-shot).
- Pre-existing and not touched: at 390 the fixed "Courses / Matches / LA" bar (`.mtabs`) shows over every view and appears mid-page in full-page screenshots.

## Known Stubs

None. The class timetable is intentionally SAMPLE data, labelled by the notice, a Sample badge per class and the banner.

## Threat Flags

None beyond the plan's register. T-tsc-01 (esc() everywhere, tel only for `^\+\d{6,}$`), T-tsc-02 (exact own-key lookup, miss shows official map), T-tsc-03 (`__proto__` tested), T-tsc-04 (noopener asserted), T-tsc-05 (action view guard, (fwz3)), T-tsc-06 (banner restore, (fwz1)/(fwz2)) are mitigated and asserted. `SCRATCH/research` and `SCRATCH/fw` were never read or run.

## Self-Check: PASSED

- prototype/index.html modified and uncommitted (verified with git status).
- Both embed checks OK, harness 316/316, cdp-keys 32/32 at 1440 and 390, diff-gate OK (and fails on a mutation), HEAD gate 4 removed lines, HEAD 77edd2f, nothing staged.
