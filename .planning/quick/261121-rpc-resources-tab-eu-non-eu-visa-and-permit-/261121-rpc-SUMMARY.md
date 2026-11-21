---
phase: quick-261121-rpc
plan: 01
subsystem: ui
tags: [prototype, resources, a11y, vanilla-js]
requires: []
provides:
  - "Resources tab in prototype/index.html: EU / EEA vs Non-EU filtered, numbered, collapsible arrival steps with sources, hours, phones, Maps links and an embassy selector"
affects: [prototype]
actuals:
  tokens: 14850
  tasks: 3
  commits: 0
plan_head_before: 77edd2f4eda918351ae8ca3ab024e46431d4f40a
plan_head_after: 77edd2f4eda918351ae8ca3ab024e46431d4f40a
tech-stack:
  added: []
  patterns: ["Data embedded by script (inject-data) between resources-data markers, rendered through esc()", "Native radios + disclosure buttons, no ARIA widgets"]
key-files:
  created: []
  modified: [prototype/index.html]
key-decisions:
  - "No default citizenship choice: nothing is shown until the student picks EU / EEA or Non-EU"
  - "Embassy selector lives in the data's own embassy-selector step (no UI-defined card added)"
requirements-completed: []
status: complete
---

# Phase quick-261121-rpc Plan 01: Resources tab Summary

Resources tab in the single-file prototype: an EU / EEA vs Non-EU radiogroup filters 7 researched steps (grouped Before / After you arrive, numbered 1..N, closed by default), each card shows instructions, documents, offices with hours, tel: phones and exact-format Google Maps links, then source link, quote and date verified; an embassy selector lists the chosen group's 38-country data.

`commits: 0` is intentional: decision D-08 forbids commits. All changes are uncommitted on branch `resources-tab` (`M prototype/index.html`). The 0 is not a missed commit.

## What was done

- Task 1 (tracer): data block, adapter (RESOURCES / EMBASSIES), nav "soon" badge removed from Resources only, view markup, radiogroup, renderResources, toggleStep, delegated listeners, scoped CSS.
- Task 2: full card body, Where-to-go blocks, link helper (http/https only, `rel="noopener"`, hidden "(opens in a new tab)", aria-hidden icon), phone linkification, embassy selector and result.
- Task 3: full harness matrix, screenshots reviewed and one batch of fixes, real key presses, diff gate.

## Verification (what was verified and how)

- `check-embed.mjs`: `EMBED OK steps=7 countries=38`, no WARNING lines. Run after every change; last run after the final edit.
- `harness.mjs` (headless Chrome, iframe viewports): **HARNESS 141/141**, 0 failures. Per viewport: 1440 and 390 each ran checks (a) to (t) for both filters plus (g) console and (u) persistence in a second run sharing the profile; (q) confirmed real innerWidth 1440 and 390. (v) regression against `git show HEAD:prototype/index.html`: innerHTML of #v-matcher, #v-catalogue, #v-la, #v-settings, #v-home, #v-schedule, #v-firstweek, .mtabs, #drawer, #printView, .data-note identical; visible view after Courses, Catalogue, Schedule, First week, Settings clicks identical; #v-firstweek is exactly `<h1>First week</h1>`. (w) console errors and warnings: 0 in every run.
  - Contrast (t) computed 109 / 179 text elements (EU / Non-EU), all >= 4.5:1. Targets (s): every `.res-head`, radio label, `#embCountry`, `.res-act` >= 44x44. No horizontal scroll at 390 (r).
  - Note: (n) Turkiye and (m) Germany each render 2 missions; fallback card verified for an EU and a Non-EU country with `hasData: false` (Austria, Egypt); "My country is not listed" links the MAE list.
- Screenshots (impeccable shot, 1440x900 and 390x844 full page, EU+Germany and Non-EU+Turkiye, plus native-scale crops) were read. Fixed in one batch: list/paragraph spacing lost to a specificity clash, definition-list label/value baseline alignment, extra gap above the first Where-to-go block. Re-shot after fixes.
- Real keyboard (`cdp-keys.mjs`, Input.dispatchKeyEvent via DevTools protocol, run at 1440 and 390): **16/16** each. ArrowRight/ArrowLeft move the radios and re-render, focus stays on the radio, Tab reaches the first header, Enter opens, Space closes and opens, visible focus outline, Tab reaches the embassy header and the select, ArrowDown to Germany renders its 2 missions without a click, no page errors.
- Diff gate: `git diff -U0 prototype/index.html` removes exactly 2 lines (the Resources nav button and the Resources view stub). No commits touch the file after 8fe945a.

## What could NOT be verified

- A real (non-headless) browser pass by a person: the plan's end-of-task human check (open prototype/index.html on a laptop and at phone width and confirm the look matches the other tabs) is still open.
- Clicking a Maps link and seeing Google Maps search the right place was not done (no network browsing); only the URL format and encoding were asserted against the data.
- Web fonts are loaded from Google Fonts; in the headless runs they may not have loaded, so layout was measured with whatever font was available.

## Data notes

- Source: `res-final/resources-data.json` only (embedded 7 steps, 38 countries; 14 countries have `hasData: true`). `research/` was never read or run. The data has no `conflicts` key (0 conflicts to report).
- `firstWeekCandidates` (1 item) is embedded, not rendered, left for First week. `notIncluded` (embedded, not rendered):
  1. EU/EEA no-visa statement: quote not found on the cited UPT pages, removed.
  2. Student work-hour limit and residence-permit tax: UPT pages disagree, not shown.
  3. Document list for the IGI EU registration: not published, not shown.
  4. IGI online portal link: not found, not shown.
  5. Dorm check-in, SIM card, bank account items: not verified, not included.
- Missing fields render "Not published. Confirm with incoming@upt.ro" (offices) or "Not published. Confirm on the embassy contact page" (embassies). Examples in the data: the Students' Health Polyclinic and UPT offices lack some phones; most Non-EU and several EU countries are `hasData: false` and show the MAE fallback card. No data value was edited. The data file may be refreshed; the page renders whatever it contains (re-run inject-data and check-embed).

## Deviations from Plan

**1. [Rule 3 - Blocking] Provided inject-data.mjs does not run**
- **Found during:** Task 1
- **Issue:** `res-final/inject-data.mjs` contains raw line-separator characters (code points 8232 and 8233) inside two regex literals, which is a JavaScript syntax error (`Invalid regular expression: missing /`).
- **Fix:** `res-tools/fix-inject.mjs` writes `res-tools/inject-data-fixed.mjs`, an identical copy where those two characters are written as backslash-u escape sequences (code points 8232 and 8233). Behaviour is otherwise the same; no data touched. The original in `res-final` was not modified. `check-embed.mjs` (unmodified) confirms the embed is deep-equal. The orchestrator may want to fix the original so a refresh runs.

**2. [Discretion] Embassy card sentence omitted**
- The plan's extra sentence "Choose your country to see its embassy and consulates in Romania." was not added: the data's own embassy-selector step already carries a near-identical summary, so it would be shown twice. The label, select and result region are as specified.

**3. [Discretion, recorded in plan] Choices made**
- No default filter choice; deadline, note, uncertainty, gloss and extraSources are rendered when present (this dataset has no extraSources or uncertainty); `source.tier`, country `evidence`, `firstWeekCandidates`, `notIncluded` are not rendered.
- Website link text is `urlLabel` when present, else "Website".

Otherwise the plan was executed as written.

## Follow-ups for the user

- The global data-note banner ("...contacts are invented") does not hold for the researched Resources data. It was not changed (D-01, D-07).
- Pre-existing at HEAD, not touched: at 390px the fixed "Courses / Matches / LA" bar (`.mtabs`) shows over every view, including Resources, and the top nav row scrolls sideways. Worth a separate fix.
- Some embassy `hours` strings are long and carry the researchers' caveats (for example the Bulgarian "two conflicting schedules" text); they are shown verbatim.

## Known Stubs

None. (Fallback "Not published" texts are the specified behaviour for unpublished data, not stubs.)

## Threat Flags

None beyond the plan's register. T-rpc-01 to 03 mitigated and asserted (esc() on all data, http/https-only anchors, `rel="noopener"`, harness check (l)).

## Self-Check: PASSED

- prototype/index.html modified, uncommitted (verified with git status).
- check-embed OK, harness 141/141, cdp-keys 16/16 at both widths, diff gate = 2 removed lines.
