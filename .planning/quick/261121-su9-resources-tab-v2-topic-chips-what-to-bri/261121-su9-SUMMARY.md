---
phase: quick-261121-su9
plan: 01
subsystem: ui
tags: [prototype, resources, a11y, vanilla-js]
requires: [quick-261121-rpc]
provides:
  - "Resources tab v2 in prototype/index.html: v2 dataset (10 steps, 38 countries), Topic chips (All / Get started / Stay & health / What to bring), action buttons, extra quotes, page tags, Resources-only data-note banner"
affects: [prototype]
actuals:
  tokens: 6500
  tasks: 3
  commits: 0
plan_head_before: 77edd2f4eda918351ae8ca3ab024e46431d4f40a
plan_head_after: 77edd2f4eda918351ae8ca3ab024e46431d4f40a
tech-stack:
  added: []
  patterns: ["Native radios in a fieldset as a chip group (:has for checked and focus ring)", "MutationObserver on the view class swaps the banner text without editing any existing line"]
key-files:
  created: []
  modified: [prototype/index.html]
key-decisions:
  - "Topic is session-only state (let resTopic), never stored (D-01)"
  - "Banner swap uses a MutationObserver on #v-resources, so showView, the delegate and the .data-note markup are untouched (D-03)"
requirements-completed: [QUICK-261121-su9]
status: complete
---

# Phase quick-261121-su9 Plan 01: Resources tab v2 Summary

Resources tab v2 in the single-file prototype: the v2 dataset is embedded, a "Topic" chip group (native radios, 44 px, arrow keys, visible focus ring) filters the arrival steps under the citizenship control, the Learning Agreement card has an "Open the Courses tab" button, extra quotes and page tags show beside their sources, and the data-note banner states where Resources data comes from only while Resources is open.

`commits: 0` is intentional: decision D-05 forbids commits. All changes are uncommitted on branch `resources-tab` (`M prototype/index.html`), HEAD is still 77edd2f, nothing is staged.

## What was done

- Task 1 (tracer): ran `inject-data.mjs` (it passed `node --check`, no fallback needed), `check-embed` prints `EMBED OK steps=10 countries=38`. Added the `fieldset.res-topic#resTopicSet` markup (hidden until a citizenship is chosen), `let resTopic="all"`, the chip sync and visibility in `renderResources`, the topic filter and the one-line empty state, the `resTopic` branch of the change listener, and the banner (`RES_BANNER`, `resBanner()`, `new MutationObserver`, one direct call). Chip CSS inside the `/* resources */` block.
- Task 2: action buttons in `resBody` (rendered only when `#v-<view>` exists and has class `view`), extra blockquotes and the `.res-ref` page tag in `resSource`, with the matching CSS.
- Task 3: harness (s) selector extended, cdp-keys extended, screenshots reviewed, diff-gate written and run.

## Verification (what was verified and how)

- `check-embed.mjs`: `EMBED OK steps=10 countries=38`, run after the last edit. No data value was typed or edited by hand.
- `harness.mjs` (headless Chrome, iframe viewports): **HARNESS 231/231**, 0 failures, exit 0. 107 checks each at 1440 and 390 (v1 (a)-(t) plus (b) chips hidden, (x1)-(x5), (y1)-(y5), (z1)-(z3), (g) console 0), persist runs at both widths (All chip checked, chips visible, no key matching /topic/i stored, console 0), and the (v) snapshot regression against HEAD.
- Derived chip counts, quoted from the check names: EU All=7, start=3, stay=2, bring=2; Non-EU All=9, start=4, stay=3, bring=2. Cross-check (x3) confirms All is 7 (EU) and 9 (Non-EU) from the page's own data. Extra blockquotes: EU 6, Non-EU 7 (y2). Page tags: EU 0, Non-EU 2 (y3). Action buttons: 1 each (y1). The Non-EU permit card contains the "Romanian bank account ... bank statement ..." item (y4).
- Contrast (t): 198 (EU) and 271 (Non-EU) text elements, all >= 4.5:1. Targets (s) now include `.res-topic label`, all >= 44x44. No horizontal scroll at 390 (r).
- Banner (z1/z2/z3): exact sentence while Resources is active (textContent and innerText), original `.data-note` innerHTML restored byte for byte on Courses, Catalogue, Home, Schedule, First week and Settings, and again after the action button navigates to Courses; sentence back on return to Resources.
- Action button (z3): clicking "Open the Courses tab" makes `#v-matcher` visible and `#v-resources` not active.
- `cdp-keys.mjs` (real key events via DevTools protocol): **23/23 at 1440 and 23/23 at 390**, exit 0. Tab from the citizenship radios lands on the Topic All chip, ArrowRight moves All -> Get started -> Stay & health -> What to bring (3, 2, 2 steps for EU, equal to the in-page derived count), focus stays on a resTopic radio with a solid outline >= 2px, ArrowLeft returns to All (7 steps). Embassy header id is now derived from the data (rh-6) and the Tab guard raised to 20.
- Zero-steps line: no real chip and citizenship pair is empty, so it was exercised only by the (x4) in-memory simulation (steps array swapped for a filtered copy, restored in a `finally`, then All clicked and the full count asserted). No data value was changed.
- Banner mechanism: MutationObserver on `#v-resources` class. Zero HEAD lines edited for it (showView, the click delegate, `.data-note` markup and CSS are untouched).
- Diff gate against `index.before-v2.html` (`diff-gate.mjs`): `DIFFGATE OK hunks=11`: css 2, markup 1, data 1, js 7 (hunk 6 changes the two `resSource` lines, hunk 9 the `const vis=` line; the rest are insertions).
- HEAD gate: `git diff -U0 prototype/index.html` removes exactly the 2 v1 lines (the Resources nav and the Resources stub), 0 other removed lines. HEAD is 77edd2f, `git rev-list --count 77edd2f..HEAD` is 0, nothing staged. Grep gates (data line excluded): `type="radio" name="resTopic"` 4, banner sentence 1, `new MutationObserver` 1, `extraQuotes` 1, `pageRef` 1, `res-ref` 2.
- Screenshots (impeccable shot, 1440x900 and 390x844 full page, separate runs: EU with Germany, Non-EU with Turkiye, Non-EU "stay" chip, Learning Agreement card only, permit card only) were read. Looked at: chip row wrapping at 390 (wraps to two rows, 8px gap, selected chip has teal fill, border and a thicker inset border), banner wrapping at 390 (three lines, readable), single renumbered "Before you arrive" and "After you arrive" groups, extra-quote spacing, the page tag beside "Source:". One fix batch: removed the extra top margin above the action button row (`#v-resources .res-body>.res-acts{margin-top:0}`), one re-shoot of the Learning Agreement card at 390. The first Non-EU full-page shot at 390 was too tall to read at scale, so the two card-only shots were used instead.

## What was NOT verified

- A human browser pass (the end-of-task human check): opening prototype/index.html on a laptop and at phone width, trying the four chips with both citizenships, checking the banner and the "Open the Courses tab" button. Still open.
- Whether web fonts loaded in headless runs: measurements and screenshots used whatever font loaded.
- Pre-existing and not touched: at 390 the fixed "Courses / Matches / LA" bar (`.mtabs`) shows over every view, including Resources, and appears mid-page in full-page screenshots.

## Data notes

No data problems found: embedded data deep-equals `res-final/resources-data.json` and the derived counts match the plan's orientation facts. No value was edited. `SCRATCH/research` was never read or run.

## Deviations from Plan

None - plan executed as written. (Two harness-only corrections while writing the new checks: the legend rule `#v-resources .res-topic legend{padding:0}` was added so the visually hidden legend measures at most 1x1 px, and the (x4) simulation clicks All before clicking the bring chip, because clicking an already-checked radio fires no change event. Neither changes any behaviour or data.)

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-su9-01 (action view guarded by `#v-<view>` existence and esc()), T-su9-02 (all strings through esc()), T-su9-03 (exact banner sentence, data via inject-data and check-embed), T-su9-04 (topic never stored, checked by (x5) and the persist run) are mitigated and asserted.

## Self-Check: PASSED

- prototype/index.html modified and uncommitted (verified with git status).
- check-embed OK, harness 231/231, cdp-keys 23/23 at 1440 and 390, diff-gate OK, HEAD gate 2 removed lines, HEAD 77edd2f, nothing staged.
