---
phase: quick-261121-tsc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - prototype/index.html
  - .planning/quick/261121-tsc-first-week-tab-who-to-ask-first-7-days-b/261121-tsc-SUMMARY.md
autonomous: true
requirements:
  - QUICK-261121-tsc
user_setup: []

estimate:
  tokens: 120000
  raw_tokens: 120000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "The embedded FIRSTWEEK_DATA is deep-equal to SCRATCH/fw-final/firstweek-data.json (the fixed check-block copy prints EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses), RESOURCES_DATA still prints EMBED OK steps=10 countries=38, and no data value was typed or edited"
    - "The First week nav button keeps its name and has no soon badge; Home page and Schedule keep theirs (D-01)"
    - "The First week view shows the H1, the intro line, the Informational-only notice, then exactly five h2 sections in this order: First 7 days, Who to ask, Buildings, Where is my room?, Your classes by building (D-01)"
    - "First 7 days shows firstDays.length numbered disclosure cards, 1..N in data order, all closed on load; an open card shows summary, instructions, where blocks with Open in Maps, action buttons that open Resources or Courses, then source link, quotes and Verified date; the null-source card shows no source row (D-05)"
    - "Who to ask shows whoToAsk.length always-visible cards with name, place, address, hours, tel: phone, mailto: email, note, Open in Maps only when mapsQuery is set, a pageRef tag and a closed Source disclosure (D-06)"
    - "Buildings lists every building under Faculties (AC first), Services and Student residences, each with address, Open in Maps, source link and note, plus one Open the official UPT map link; there is no embedded map anywhere (D-02, D-07)"
    - "Where is my room? does an exact own-key lookup in rooms.table after trim, inner-space removal and upper-casing the leading letters: A117, B426, C303, B019 and b426 decode to building, wing, floor and room; Z999 and A5 show Not in our map yet with the official map link; empty input asks for a code; the result region is aria-live polite (D-03)"
    - "Your classes by building shows the sample notice, one group card per building with N classes and Open in Maps, and one closed Sample-badged button row per sample class that opens to course, time, type and the decoded room (D-04)"
    - "While First week is active the data-note banner reads exactly the D-08 sentence; Resources still shows its own sentence; every other view gets the original innerHTML back byte for byte (D-08)"
    - "All pre-existing checks still pass at 1440 and 390 (three are re-scoped on purpose), there is no horizontal scroll at 390, targets are at least 44x44, contrast is at least 4.5:1, the console is clean, other views match HEAD, and nothing is committed or staged (D-09, D-10)"
  artifacts:
    - path: prototype/index.html
      provides: "First week markup, /* first week */ CSS block, firstweek-data script (FIRSTWEEK_DATA), first-week JS (renderFirstWeek, room search, classes, banner observer)"
      contains: "firstweek-data:begin"
    - path: .planning/quick/261121-tsc-first-week-tab-who-to-ask-first-7-days-b/261121-tsc-SUMMARY.md
      provides: "What was and was not verified, derived counts, diff-gate hunks, data observations"
  key_links:
    - from: prototype/index.html
      to: prototype/index.html
      via: "nav button data-view=firstweek -> existing click delegate (t.dataset.view) -> showView('firstweek') -> #v-firstweek"
      pattern: 'data-view="firstweek"'
    - from: prototype/index.html
      to: prototype/index.html
      via: "FIRSTWEEK_DATA const in the firstweek-data script -> renderFirstWeek() -> #fwDays, #fwWho, #fwBuildings, #fwClasses"
      pattern: "renderFirstWeek"
    - from: prototype/index.html
      to: prototype/index.html
      via: "#fwRoomForm submit -> fwRoomSearch() -> hasOwnProperty lookup in FW.rooms.table -> #fwRoomResult"
      pattern: "fwRoomSearch"
    - from: prototype/index.html
      to: prototype/index.html
      via: "MutationObserver on #v-firstweek class, created after the Resources observer -> fwBanner() -> .data-note (reuses resNote and resNoteHtml0 read-only)"
      pattern: "fwBanner"
    - from: prototype/index.html
      to: prototype/index.html
      via: "disclosure buttons carry data-step -> existing delegate line -> existing toggleStep() (no delegate edit)"
      pattern: "data-step"
---

<objective>
Build the First week tab in the single-file prototype (prototype/index.html), replacing the one-line stub. English only. Five sections: "First 7 days" step cards, "Who to ask" office cards, "Buildings" list with Open in Maps links, a "Where is my room?" exact-lookup search, and "Your classes by building" built from SAMPLE classes. There is no embedded map, only Maps links.

Purpose: in week 1 a student is on a phone in an unfamiliar city. They need the next step, the right office, the building and the room, each traced to an official UPT source (PRODUCT.md principle 1 "Sources over assertions", principle 4 "Clear to a newcomer").

Output: an edited prototype/index.html (uncommitted on branch `resources-tab`) and the quick-task SUMMARY.

Requirement ID: `QUICK-261121-tsc` (quick task, no ROADMAP requirement; it previews the Phase 4 campus-map idea in the prototype only).

Decision IDs. The orchestrator's locked user decisions are numbered in order:
- D-01 five sections in this order after the H1, the intro line and the Resources notice; English only; tab name kept; remove only the First week soon badge.
- D-02 no embedded map; every building and office with a mapsQuery gets "Open in Maps" built exactly as the Resources Maps URL (same helper, new tab, rel="noopener", hidden "(opens in a new tab)"); Buildings has one prominent "Open the official UPT map" link.
- D-03 "Where is my room?" labelled input, Enter or Search, normalisation, exact key lookup, exact result wording, not-found and empty states, aria-live polite.
- D-04 "Your classes by building": sample notice, group cards by building, Sample-badged class button rows that expand to the decoded room.
- D-05 "First 7 days": numbered disclosure cards, closed by default, content order, action buttons, source row (none when source is null).
- D-06 "Who to ask": always-visible cards, fields, tel:/mailto:, Maps only with mapsQuery, pageRef tag, closed "Source" disclosure; missing fields omitted.
- D-07 "Buildings": groups Faculties / Services (rectorate, library, clinic, canteen) / Student residences; AC first in Faculties; name, address, Open in Maps, pageRef/source link, note.
- D-08 banner sentence while First week is active; byte-for-byte restore elsewhere; Resources keeps its own; MutationObserver style, new code only.
- D-09 same look and voice; one new `/* first week */` CSS block, every selector scoped to `#v-firstweek` or a new `fw-` class; WCAG 2.2 AA; no new dependencies, no build step.
- D-10 no git commit, add, push, stash, checkout or worktree; do not touch Settings, Courses, Catalogue, Schedule, Home or the Resources view and data.

Data rule (RR-data, from the orchestrator): SCRATCH/fw-final/firstweek-data.json is FINAL. Never edit a data value, never read or use SCRATCH/research or SCRATCH/fw, never invent a room code, hour, phone or address. A data problem goes in the SUMMARY.
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@PRODUCT.md
@COLOR-GUIDE.md
@.claude/skills/karpathy-guidelines/SKILL.md
@.planning/quick/261121-su9-resources-tab-v2-topic-chips-what-to-bri/261121-su9-SUMMARY.md

The two earlier Resources plans built the conventions and the harness this task extends. Their check letters (a)-(z) are used below. Read .planning/quick/261121-su9-resources-tab-v2-topic-chips-what-to-bri/261121-su9-PLAN.md only if a check name below is unclear. Do not re-implement anything from it.

Do NOT Read prototype/index.html whole. Line 485 is the huge `const RESOURCES_DATA` line, and after Task 1 there is a second one, the `const FIRSTWEEK_DATA` line (about 30.5k chars). Skip both in every Read. Line numbers below are for the current working tree, which is byte-identical to SCRATCH/index.before-fw.html (checked at planning time). They shift after Task 1, so use Grep after that.
- 10-22: :root tokens and the global `:focus-visible` ring. 63-71: `.view`, h1, h2 (uppercase label style), `.muted`. 79-95: `.btn` family, global `label`, text input/select and `input:focus` rules. 124: `.notice`. 254-255: `.kv`.
- 259-331: the `/* resources */` CSS block, ending with a 760px media query; 332 is `</style>`. Copy declarations from it; never edit it.
- 344: the First week nav button (ends with the soon badge span). 339 and 342: the Home page and Schedule buttons, which keep their badges.
- 358: `.data-note` markup. 446: the Resources notice line (copy it). 466: the one-line First week stub.
- 483-487: the resources-data script (485 = data line). 488: the main `<script>`.
- 761-766: `showView`. 780-802: the click delegate. 788 is `else if(t.dataset.view)showView(t.dataset.view);` and 801 is `else if("step" in t.dataset)toggleStep(t);`.
- 829-964: the Resources JS. Reusable helpers, read-only: `esc`, `$`, `ICON.ext`, `resHost` (839), `resLink(url,text,cls)` (841-844; http/https only, target _blank, rel noopener, `res-vh` hidden span, aria-hidden ext icon), `resMapsUrl` (858), `resSource(s)` (880-887; Source link, `res-ref` page tag, main quote and extraQuotes as blockquotes, "Verified: <date>", empty string when source is null), `toggleStep(b)` (944-948), `resNote` and `resNoteHtml0` (957-958, the original banner innerHTML captured before any swap), `resBanner` and its observer (959-964).
- 964 `resBanner();`, 965 blank, 966 `if(active)matchCache…`, 967 `renderAll();renderProfile();`, 968 `renderResources();`.

Absolute paths. SCRATCH = C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad
- Data, read-only: SCRATCH/fw-final/firstweek-data.json. Embed tools: SCRATCH/fw-final/inject-block.mjs (args: html, json, markerBase, ConstName) and SCRATCH/fw-final/check-block.mjs (args: json, html, markerBase, ConstName). Use markerBase `firstweek-data` and ConstName `FIRSTWEEK_DATA`.
- PLANNING-TIME FINDING: check-block.mjs has a string-escape bug. It builds its regex from the JS string `"\s*="`, which loses the backslash, so it prints `EMBED FAIL: const FIRSTWEEK_DATA declared 0 times` on a correct embed. Reproduced on a scratch copy. SCRATCH/plan-probe/fix-cb.mjs (args: src, out) writes a copy whose only change is that one literal, now a real `\s`. The patched copy printed the exact EMBED OK line on a correct embed and EMBED FAIL on the null block. Task 1 creates SCRATCH/res-tools/check-block-fixed.mjs with it. Do not edit the original, and report this in the SUMMARY.
- Resources embed tools stay as they are: SCRATCH/res-final/check-embed.mjs (args: json, html) must keep printing `EMBED OK steps=10 countries=38`.
- Harness tools to EXTEND, not rewrite: SCRATCH/res-tools/harness.mjs (88 lines), page-tests.js (411 lines; `run()` ends with the async `steps2` sequencer at 353-382; `snapshotMode` is at 15-29; `persistMode` is at 385-398), cdp-keys.mjs (101 lines), make-shots.mjs, make-cards.mjs, diff-gate.mjs (35 lines). The Resources tests select `.res-step`, `.res-head`, `.res-num` and `.res-body` page-wide, so First week markup must NEVER use those four classes. It may emit `res-src`, `res-ref` and `res-vh` only through the reused helpers.
- Pre-change copy for the diff gate: SCRATCH/index.before-fw.html. Chrome: C:/Program Files/Google/Chrome/Application/chrome.exe.

Data facts, checked at planning time. They are for orientation only; tests must derive every number from FIRSTWEEK_DATA in the page.
- whoToAsk 6, in order: airport-border (phone and note only), international-students-office, ac-secretariat, student-certificate (place "Room 110" and hours only), health-polyclinic, upt-library. 4 have mapsQuery, 4 have phone, 3 have email. All sources are media.upt.ro with a pageRef ("Guide p. 9" etc.) and 0-3 extraQuotes.
- firstDays 7: arrive, register, enrol, student-cards, orientation, learning-agreement-changes, immigration. 2 where blocks, both with mapsQuery and hours strings. Actions: arrive -> "More about the dorm in Resources" (resources); learning-agreement-changes -> "Open the Courses tab" (matcher); immigration -> "Open Resources" (resources), and its source is null. firstDays sources have pageRef null.
- buildings 14, by kind: faculty 7 (ac first in data order), rectorate 1, clinic 1, canteen 2, library 1, residence 2. Each has address, mapsQuery and source {url, quote, quoteVerified, verified, optional pageRef}. 6 have a note. Only the library has a pageRef.
- officialMap {url "https://maps.upt.ro", label "Open the official UPT map"}. roomBuildings: electro "Electro building" (corps A, B, D), chemistry "Chemistry faculty building" (corp C). Each has a source quote in Romanian and an English note.
- rooms.table: 287 keys, floors 0-7, no negative floors, every corp is covered by a roomBuilding. One key has a lower-case suffix: `B129b`. A117 = A/1, B426 = B/4, C303 = C/3, B019 = B/0. Z999, A5 and b426 are not keys.
- sampleClasses 7 (rooms A117 x3, B515, B521, A305, C303): Electro 6 classes, Chemistry 1. sampleNotice: "Sample timetable. These are not your real classes. The room codes are real rooms on the official UPT map."
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Tracer: embed FIRSTWEEK_DATA, view skeleton, banner, First 7 days, Who to ask and Buildings, with harness checks</name>
  <files>prototype/index.html, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/page-tests.js, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/harness.mjs, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/check-block-fixed.mjs</files>
  <precondition>`cmp SCRATCH/index.before-fw.html prototype/index.html` reports no difference and `git rev-parse --short HEAD` is 77edd2f.</precondition>
  <read_first>
    - .claude/skills/impeccable/reference/craft-floor.md (the impeccable skill requires it right before any UI edit) and .claude/skills/karpathy-guidelines/SKILL.md
    - prototype/index.html in ranges only: 10-24, 63-71, 79-95, 124, 254-255, 259-332, 336-358, 443-466, 483-488 (skip 485), 761-766, 780-802, 839-887, 944-968
    - SCRATCH/res-tools/page-tests.js lines 1-75 and 340-411; SCRATCH/res-tools/harness.mjs (whole file)
    - The data shape: print keys, counts and one entry of each array of SCRATCH/fw-final/firstweek-data.json with a short node command. Never Read the full JSON into context.
  </read_first>
  <action>
The tracer path: real data in the page, then the view markup, the render function, the nav and showView, the banner observer and the headless harness. A harness run must prove it before Task 2 adds the room search and the classes.

1. Embed (RR-data). Insert NEW lines directly after line 487 (the closing tag of the resources-data script) and before the main `<script>`. They form a separate script element whose middle holds exactly three lines: `/* firstweek-data:begin */`, `const FIRSTWEEK_DATA = null;`, `/* firstweek-data:end */`. From the repo root run `node <SCRATCH>/fw-final/inject-block.mjs prototype/index.html <SCRATCH>/fw-final/firstweek-data.json firstweek-data FIRSTWEEK_DATA`. Then run `node <SCRATCH>/plan-probe/fix-cb.mjs <SCRATCH>/fw-final/check-block.mjs <SCRATCH>/res-tools/check-block-fixed.mjs`. Then `node <SCRATCH>/res-tools/check-block-fixed.mjs <SCRATCH>/fw-final/firstweek-data.json prototype/index.html firstweek-data FIRSTWEEK_DATA` must print exactly `EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses`. Never hand-edit the data line.

2. Nav (D-01). On line 344 remove only the trailing soon badge span of the First week button. Keep its icon, its text "First week" and the other two badges.

3. Markup (D-01). Replace only the one-line First week stub (line 466). Keep the id `v-firstweek` and the class `view`. Inside goes a wrapper `<div class="fw">` holding, in order:
   - `<h1>First week</h1>`;
   - `<p class="muted" style="margin:0">Who to ask, where each building is, and what to do in your first days.</p>`;
   - the notice: a byte-for-byte copy of line 446 (role="note", info-circle SVG, "Informational only. Verify with" plus the incoming@upt.ro mailto link and a full stop);
   - five `<section>` elements in this order, each with `aria-labelledby` pointing to its own `<h2 id>`. The texts are exactly "First 7 days", "Who to ask", "Buildings", "Where is my room?", "Your classes by building". The containers are `<div id="fwDays">`, `<div id="fwWho">`, `<div id="fwBuildings">`, `<div id="fwRoomBox">` and `<div id="fwClasses">`. Task 2 fills the last two.

4. JS (D-05, D-06, D-07, D-02). Add a NEW block, starting with the comment line `// ---- first week ----`, directly after line 964 (`resBanner();`) and before the blank line. Add the init line `renderFirstWeek();` as a NEW line directly after line 968 (`renderResources();`). Edit no existing line. Everything goes through `esc()`. Reuse the helpers listed in the context read-only: resLink, resMapsUrl, resHost, resSource and toggleStep.
   - `const FW=FIRSTWEEK_DATA;` and `const fwMaps=q=>q?resLink(resMapsUrl(q),"Open in Maps","fw-act"):"";`. This is the single Maps builder (D-02). It is never built from an address or a name.
   - renderFirstWeek(): if FW is null, put `<p class="muted">Not published. Confirm with <a href="mailto:incoming@upt.ro">incoming@upt.ro</a></p>` in each container and return. Otherwise fill #fwDays, #fwWho and #fwBuildings (Task 2 adds the other two).
   - First 7 days (D-05). One `<article class="fw-step">` per firstDays item, in data order, numbered n = index+1. Header: `<h3>` wrapping `<button type="button" class="fw-head" data-step id="fwh-<i>" aria-expanded="false" aria-controls="fwd-<i>">`, holding `<span class="fw-num">n</span><span class="fw-title">title</span>` and the same chevron SVG as resCard (aria-hidden="true", class `fw-chev`). The panel is `<div class="fw-body" id="fwd-<i>" hidden>`, holding in this order:
     - the summary as a `<p>`;
     - instructions as `<ol class="fw-list">`, only when non-empty;
     - when where is non-empty, `<h4 class="fw-sub">Where to go</h4>`, then one `<div class="fw-where">` per entry: `<b>name</b>`, a `.kv` dl with Address and Opening hours rows (each row only when the value is not null), and `<div class="fw-acts">` with fwMaps(mapsQuery);
     - when actions is non-empty, `<div class="fw-acts">` with one `<button type="button" class="fw-act" data-view="<view>">label</button>` per action. Render a button only when `document.getElementById("v-"+view)` exists and has class `view` (same guard as Resources). The existing delegate line 788 handles the click;
     - `resSource(item)`, which renders nothing for the immigration card.
     The existing delegate line 801 calls toggleStep for `data-step`, so the delegate is not edited.
   - Who to ask (D-06). One always-visible `<article class="fw-office">` per whoToAsk item, in data order:
     - `<div class="fw-oname"><h3>name</h3></div>`;
     - a `.kv` dl. Rows, each only when its value is not null or not empty: "Where" (place), "Address", "Opening hours" (hoursLines as `<ul class="fw-lines">`), "Phone" and "Email". Phone is `<a class="fw-act" href="tel:<phone>">phoneDisplay</a>`, but only when phone matches `^\+\d{6,}$`; otherwise it is plain escaped text. Email is `<a class="fw-act" href="mailto:<email>">email</a>`;
     - `<p class="muted fw-note">note</p>` when the note is present;
     - `<div class="fw-acts">` with fwMaps(mapsQuery) (nothing when it is null), then the Source disclosure button `<button type="button" class="fw-srcbtn" data-step id="fwoh-<i>" aria-expanded="false" aria-controls="fwo-<i>">Source<span class="res-vh"> for <name></span> + chevron</button>`, then `<span class="fw-ref">pageRef</span>` when pageRef is a non-empty string;
     - `<div class="fw-osrc" id="fwo-<i>" hidden>` holding resSource(item): source link, quote, extraQuotes and "Verified: <date>".
     Fields that are missing are simply omitted. No "Not published" text here (D-06).
   - Buildings (D-07, D-02).
     - First `<p>` with resLink(FW.officialMap.url, FW.officialMap.label, "btn btn-outline fw-mapbtn").
     - Then three groups, each `<h3 class="fw-sub">` plus `<ul class="fw-blist">`, omitted when empty:
       - "Faculties": kind faculty, with id "ac" moved first and the rest in data order;
       - "Services": kinds rectorate, library, clinic and canteen, sorted by that kind order and stable within a kind;
       - "Student residences": kind residence.
     - Each item is `<li class="fw-bld" data-id="<id>">` with `<h4 class="fw-bname">name</h4>`, `<p>address</p>`, `<p class="muted fw-note">note</p>` when present, and `<div class="fw-acts">` holding fwMaps(mapsQuery), then resLink(source.url, "Source: "+resHost(source.url)), then `<span class="res-ref">pageRef</span>` when present.
   - Banner (D-08). New lines at the end of the block:
     - `const FW_BANNER="Prototype. In First week, offices, buildings and rooms come from official UPT pages and the official UPT map, checked 21 Nov 2026. The class timetable is a sample.";`
     - function fwBanner(): when #v-firstweek has class "on", set resNote.textContent to FW_BANNER (only if it differs). Otherwise, ONLY when resNote.textContent equals FW_BANNER, set resNote.innerHTML to resNoteHtml0. This "restore only what we own" rule keeps the Resources sentence intact on a First week -> Resources switch;
     - `new MutationObserver(fwBanner).observe($("#v-firstweek"),{attributes:true,attributeFilter:["class"]});` and one direct `fwBanner();` call.
     Because this observer is created after the Resources one and observer callbacks run in creation order, a Resources -> First week switch restores first and then sets the First week sentence. Do not touch resBanner, showView, the delegate or the `.data-note` markup.

5. CSS (D-09). Add ONE new block, starting with the line `/* first week */`, directly before `</style>`, after the Resources media query. Every selector starts with `#v-firstweek`. Use :root tokens and COLOR-GUIDE hex values only (no new hues, no decorative teal):
   - `.fw{max-width:760px}`; `.fw h2` gets the `#v-resources .res h2` declarations.
   - Copy the declarations of the Resources rules on lines 279-290 under the new names: `.res-step` becomes `.fw-step`, `.res-head` becomes `.fw-head`, `.res-num` becomes `.fw-num`, `.res-title` becomes `.fw-title`, `.res-chev` becomes `.fw-chev` (with the aria-expanded rotate), `.res-body` becomes `.fw-body` (with the `[hidden]` guard and child spacing).
   - Also copied: links (291-292); overflow-wrap anywhere (293), applied to `.fw-body`, `.fw-office`, `.fw-bld`, li and dd; `.fw-sub` from `.res-sub` (294-295); `.fw-list` and `.fw-lines` (296-300); the `.fw-where` divider (301-302); `.kv` overrides (305, 307); `.fw-acts` and `.fw-act` from `.res-acts` and `.res-act`, including the `button.fw-act` variant (310-313); `.res-ref`, `.res-vh`, `.res-src` and its p and blockquote rules (315-320); `.fw-ref` with the `.res-ref` declarations.
   - New rules:
     - `.fw-office` uses the panel background, a 1px `--line` border, radius `--r`, padding about 14px 16px and margin-bottom 10px. Never nest a card inside it.
     - `.fw-oname h3` is about 15.5px, weight 700, margin 0.
     - `.fw-srcbtn` is inline-flex, items centred, gap 5px, min-height and min-width 44px, background none, border 0, padding 0, font inherit, weight 600, accent colour. Its chevron rotates when aria-expanded is true.
     - `.fw-osrc` has the `[hidden]` guard.
     - `.fw-blist` is one panel per group (panel background, `--line` border, radius `--r`, list-style none, margin 0, padding 0 16px). `.fw-bld` gets padding 14px 0, and `.fw-bld+.fw-bld` gets a 1px `--line` top border. `.fw-bname` is 14.5px, weight 700, margin 0.
     - `.fw-mapbtn` has min-height 44px.
   - Inside a 760px media query: `.fw-body` padding left and right 14px, and `.kv` becomes one column, as the Resources media query does.
   Discretion, recorded here: Buildings is a list inside one panel per group, not a card per building (craft-floor: cards are the lazy container). Who to ask cards are one column, stacked like the Resources step cards.

6. Harness. Extend, do not rewrite. Derive every expected value from FIRSTWEEK_DATA in the page.
   - page-tests.js, check (a): replace its second check with "(a) no soon badge on Resources or First week; Home page and Schedule keep theirs".
   - page-tests.js, (z2) loop: also skip data-view "firstweek". First week is checked by the new (fwz) steps.
   - harness.mjs (v): skip the key `#v-firstweek` in the identical-to-HEAD loop. Replace the exact-stub check with "(v) HEAD First week is the stub and the work tree has the First week UI": snapH value === `<h1>First week</h1>`, and the snapW value contains `<h1>First week</h1>` and `id="fwDays"`.
   - page-tests.js: add a new function fwRun() inside the IIFE. Call it from run() after the (y) group and before the steps2 sequencer. It clicks the First week nav button first. Checks:
     - (fw1) only #v-firstweek is on. The h1 is "First week". The intro text is exact. The notice text is "Informational only. Verify with incoming@upt.ro." with the mailto. The `#v-firstweek h2` textContents are exactly the five D-01 strings in order. There is no iframe, canvas, svg map or img inside #v-firstweek other than the icon SVGs (D-02: maps are reached only through links).
     - (fw2) `.fw-step` count equals firstDays.length. `.fw-num` reads 1..N. Every `.fw-head` is a BUTTON with aria-expanded false and a hidden aria-controls panel. Click each header: the panel opens and holds the summary, instructions.length li, where.length `.fw-where` (each with a Maps link for its mapsQuery), one `button[data-view]` per action whose view element exists (text equals the label), and, when source is not null, a link with href source.url, (quote?1:0)+extraQuotes.length blockquotes with texts equal in order, and "Verified: "+verified. When source is null there is no `.res-src`. Click again: closed.
     - (fw3) `.fw-office` count equals whoToAsk.length. Per card:
       - the h3 equals the name;
       - each non-null field's text is present;
       - one tel: link with href "tel:"+phone and text phoneDisplay exactly when phone is not null;
       - one mailto: link exactly when email is set;
       - one Maps link exactly when mapsQuery is not null;
       - `.fw-ref` text equals pageRef;
       - the `.fw-srcbtn` is closed and its panel hidden; opening it shows the source link, all quotes and the Verified date; close it again.
     - (fw4) The group headings in #fwBuildings read Faculties, Services, Student residences (non-empty groups only). The `data-id` order of each group equals the derived order (ac first; services by kind order). The sum of items equals buildings.length. Each item has its address text, exactly one Maps link, a link to source.url, `.res-ref` exactly when pageRef is set, and the note exactly when set. `a.fw-mapbtn` has href officialMap.url, its text contains the label, and target _blank.
     - (fw5) Every `#v-firstweek a[href^="https://www.google.com/maps/"]` href equals resMapsUrl-format (base + encodeURIComponent(q)) for some mapsQuery in FIRSTWEEK_DATA. It has no raw space, and new URL(href).searchParams.get("query") returns q.
     - (fw6) Every tel: href matches `^tel:\+\d{6,}$`. Every mailto: href matches `^mailto:[^\s@]+@[^\s@]+\.[a-z]{2,}$`.
     - (fw7) Every `target="_blank"` anchor in #v-firstweek has rel containing noopener and a `.res-vh` "(opens in a new tab)" span. Every href starts with https:, http:, mailto: or tel:.
   - page-tests.js async (fwz). Insert these steps into steps2 after the (z3) steps and before the `chip("bring")` (z-end) step, with one tick per step, as the sequencer already does. The expected sentence is a literal copied from D-08 into page-tests.js, never read from the page.
     - (fwz1) Click the First week nav, tick: `.data-note` textContent.trim() and innerText.trim() equal the FW literal.
     - (fwz2) Click Resources, tick: the Resources BANNER literal. Click First week, tick: the FW literal. Click Courses, tick: innerHTML === NOTE0. Click First week, then Settings through the account menu, tick: NOTE0. Click First week, then Catalogue, tick: NOTE0.
  </action>
  <verify>
    <automated>S=C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad; F=prototype/index.html; test "$(node "$S/res-tools/check-block-fixed.mjs" "$S/fw-final/firstweek-data.json" $F firstweek-data FIRSTWEEK_DATA)" = "EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses" && test "$(node "$S/res-final/check-embed.mjs" "$S/res-final/resources-data.json" $F)" = "EMBED OK steps=10 countries=38" && node "$S/res-tools/harness.mjs" && test "$(grep -c 'data-view="firstweek".*class="soon"' $F)" -eq 0 && test "$(grep -c 'data-view="home".*class="soon"' $F)" -ge 1 && test "$(grep -c 'data-view="schedule".*class="soon"' $F)" -ge 1 && test "$(grep -c -F '/* first week */' $F)" -ge 1 && test "$(grep -v -e 'const RESOURCES_DATA' -e 'const FIRSTWEEK_DATA' $F | grep -c 'new MutationObserver')" -ge 2 && test "$(grep -v -e 'const RESOURCES_DATA' -e 'const FIRSTWEEK_DATA' $F | grep -c -F 'Prototype. In First week, offices, buildings and rooms come from official UPT pages and the official UPT map, checked 21 Nov 2026. The class timetable is a sample.')" -ge 1</automated>
    Baselines (working tree = before-fw, 2026-11-21): check-block-fixed.mjs file [HEAD=absent EXPECT==present] (its output must also equal the exact EMBED OK line; the unfixed original prints EMBED FAIL on a correct embed); check-embed exit code [HEAD=0 EXPECT==0 GUARD MUTATION: touching the Resources data]; harness exit code [HEAD=0 EXPECT==0 GUARD MUTATION: breaking a Resources check; it was 231/231 at the end of su9]; First week soon badge lines [HEAD=1 EXPECT==0]; Home page badge lines [HEAD=1 EXPECT>=1 GUARD MUTATION: removing the wrong badge]; Schedule badge lines [HEAD=1 EXPECT>=1 GUARD MUTATION: removing the wrong badge]; first week CSS marker lines [HEAD=0 EXPECT>=1]; MutationObserver lines outside the data lines [HEAD=1 EXPECT>=2]; banner sentence lines [HEAD=0 EXPECT>=1].
  </verify>
  <done>Both embed checks print EMBED OK. The First week tab opens without a soon badge and shows the H1, intro, notice and five ordered sections. First 7 days, Who to ask and Buildings render from FIRSTWEEK_DATA with exact Maps, tel: and mailto: links. The banner shows the D-08 sentence only on First week, and Resources keeps its own. The harness passes all checks, including (fw1)-(fw7) and (fwz1)-(fwz2), at 1440 and 390 with 0 console errors. Nothing is committed (D-10).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Where is my room? exact lookup and Your classes by building, with action-button checks</name>
  <files>prototype/index.html, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/page-tests.js</files>
  <read_first>
    - prototype/index.html: only the First week markup, the `/* first week */` CSS block and the `// ---- first week ----` JS block from Task 1 (find them with Grep; skip both data lines)
    - SCRATCH/res-tools/page-tests.js: only fwRun() and the (fwz) steps from Task 1
  </read_first>
  <behavior>
    - fwRoom("A117") decodes to the electro building, Corp A, Floor 1; "B426" to electro, Corp B, Floor 4; "C303" to chemistry, Corp C, Floor 3; "B019" shows "Floor: 0 (ground floor)"
    - " b 426 " and "b426" normalise to B426 and decode like B426
    - "Z999", "A5" and "__proto__" show "Not in our map yet. Check the code, or open the official UPT map." plus the official map link, with no exception
    - "" (and spaces only) shows the prompt to type a code
    - the classes group count, the per-group "N classes" text and the Sample badge count equal what the data gives
  </behavior>
  <action>
Write the (fw8) and (fw9) checks below in page-tests.js first. Run the harness and confirm they fail (RED: #fwRoomForm and .fw-group do not exist yet). Then implement until the harness passes (GREEN). There are no commits (D-10).

1. Room search markup (D-03). Inside `<div id="fwRoomBox">` add static markup, so focus stays in the form across searches:
   - `<form id="fwRoomForm" class="fw-room" role="search" novalidate>` holding `<label for="fwRoom">Room code</label>` and `<div class="fw-room-row">`. The row holds `<input type="text" id="fwRoom" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12">`, whose placeholder attribute is exactly `Room code, e.g. B426, A117`, and `<button type="submit" class="btn btn-primary">Search</button>`;
   - then `<div id="fwRoomResult" aria-live="polite"></div>`.
   Enter in the input and a click on Search both submit the form. The click passes through the existing delegate without matching any branch.

2. Room JS (D-03). These are new lines in the first-week block. Bind `$("#fwRoomForm").addEventListener("submit", …)` with preventDefault, calling fwRoomSearch().
   - fwNorm(v): String(v).trim(), then remove all whitespace, then upper-case only the leading run of letters (`/^[A-Za-z]+/`). Leave the rest as typed. This is D-03 literally: "b129b" finds the key B129b, and "B129B" does not. Record that observation in the SUMMARY; do not add a case-insensitive fallback.
   - fwRoomInfo(code): when `Object.prototype.hasOwnProperty.call(FW.rooms.table, code)`, return {code, corp, floor, b}, where b is the roomBuilding whose corps includes corp. Otherwise return null. If b is missing, also return null: never guess.
   - fwRoomLines(info) returns four `<p class="fw-line">` elements whose normalised textContents are exactly:
     - "Building: <b.name>, <b.address>"
     - "Wing: Corp <corp>"
     - "Floor: <floor>", where floor 0 reads "Floor: 0 (ground floor)"
     - "Room: <code>"
     Each starts with `<span class="fw-lbl">Label:</span>`. After them comes `<div class="fw-acts">` with fwMaps(b.mapsQuery). Task 2 point 4 reuses this function.
   - fwRoomSearch(): read #fwRoom and normalise it.
     - Empty: `<p class="muted">Type a room code, for example B426.</p>`.
     - Found: `<div class="fw-result">` with fwRoomLines, then `<div class="fw-roomsrc">` holding `<p class="muted">Room data: official UPT map (maps.upt.ro).</p>`, a `<blockquote cite="<b.source.url>">` with b.source.quote, a `<p>` with resLink(b.source.url, "Source: "+resHost(b.source.url)), and `<p class="muted">b.note</p>`.
     - Not found: `<div class="fw-result">` with `<p>Not in our map yet. Check the code, or open the official UPT map.</p>` and resLink(FW.officialMap.url, FW.officialMap.label, "fw-act").
     Everything goes through esc(). The typed text is only ever shown through esc() (T-tsc-03).
   - renderFirstWeek() clears #fwRoomResult.

3. Classes markup (D-04). renderFirstWeek fills #fwClasses:
   - first, the sampleNotice in the global `.notice` markup (role="note", the same info-circle SVG as the page notice), with the text escaped;
   - then one `<article class="fw-group">` per roomBuilding that has at least one class, in roomBuildings order. A building comes from rooms.table[room].corp and the roomBuilding whose corps includes it. Classes whose room has no building go into a last group titled "Not in our map yet", with no address and no Maps link, so no class is ever dropped silently.
   - Group head `<div class="fw-ghead">` holds `<h3>name</h3>`, `<p class="muted">address</p>`, `<p class="fw-count">N classes</p>` and `<div class="fw-acts">` with fwMaps(mapsQuery). Discretion, recorded here: N=1 reads "1 class", in plain English per the PRODUCT.md voice rules.
   - Then `<ul class="fw-classes">` with one `<li>` per class in data order. Each li holds:
     - `<button type="button" class="fw-class" data-step id="fwch-<k>" aria-expanded="false" aria-controls="fwc-<k>">`, where k is the index in sampleClasses. Inside it: `<span class="fw-when">Day start–end · type</span>` (en dash, middle dot), `<span class="fw-what">course · room</span>`, `<span class="fw-sample">Sample</span>` and the chevron;
     - `<div class="fw-cbody" id="fwc-<k>" hidden>` with `<p class="fw-line">` lines "Course: <course>", "Time: <day> <start>–<end>" and "Type: <type>", then fwRoomLines(fwRoomInfo(room)). When that info is null, it shows "Room: <room>" plus "Not in our map yet." instead.
   toggleStep opens the rows through the existing delegate.

4. CSS (D-09), added inside the `/* first week */` block before its media query, with the same scoping rules:
   - `.fw-room label`: override the global label rule only in this scope where needed;
   - `.fw-room-row`: flex, gap 8px, wrap. The input gets flex 1 1 200px, min-width 0 and min-height 44px. The Search button gets min-height 44px;
   - `#v-firstweek ::placeholder` gets the `--faint` colour (#6b7178, at least 4.5:1 on white, per craft-floor);
   - `.fw-result` is a panel (background, `--line` border, radius `--r`, padding about 14px 16px, margin-top 10px). `.fw-line` has margin 0 and 3px between lines. `.fw-lbl` is weight 600 with `--sub` colour;
   - `.fw-roomsrc` and its blockquote use the `.res-src` and blockquote declarations;
   - `.fw-group` uses the `.fw-office` card declarations. `.fw-ghead` has padding-bottom 10px. `.fw-count` is a neutral tag (`--chip` background, `--sub` text, 12px, weight 600, radius 5px, padding 2px 7px, inline-block);
   - `.fw-classes` has list-style none, margin 0 and padding 0;
   - `.fw-class` is a full-width native button: grid or flex wrap, gap 2px 10px, min-height 56px, padding 10px 0, left-aligned text, background none, border 0, a `--line` top border, font inherit. `.fw-when` is weight 700 with tabular-nums. `.fw-what` uses `--sub`. The chevron rotates on aria-expanded true;
   - `.fw-sample` uses the warn tokens (background #fff6dc, border 1px #ecd28a, text #6b4d00, 12px, weight 600, radius 5px, padding 2px 7px). Discretion, recorded here: warn, not neutral, because it flags sample data, as COLOR-GUIDE "data notices" does;
   - `.fw-cbody` has padding 4px 0 14px and a `[hidden]` guard.
   No one-sided borders on rounded boxes (craft-floor ban). The blockquote keeps the existing Resources left rule, which is not a rounded box.

5. Checks in page-tests.js, inside fwRun() and after (fw7). Derive every value from FIRSTWEEK_DATA. Helper: set #fwRoom.value, then click `#fwRoomForm button[type=submit]`. The submit handler runs synchronously.
   - (fw8) Form semantics:
     - `label[for=fwRoom]` exists and the placeholder is exact;
     - #fwRoomResult has aria-live "polite";
     - for each of A117, B426, C303, B019, "b426" and " B 426 ", the four lines equal the derived strings. Cross-check against D-03: A117 = electro/A/1, B426 = electro/B/4, C303 = chemistry/C/3, B019 = "Floor: 0 (ground floor)". A mismatch fails with the detail "data finding";
     - a found result has exactly one Maps link, for the building's mapsQuery, plus the "Room data: official UPT map (maps.upt.ro)." line, the source quote blockquote and the note;
     - "Z999", "A5" and "__proto__" show the exact not-found sentence and one link whose href is officialMap.url, with no new console error;
     - "" and "   " show /Type a room code/;
     - end the check with the result cleared.
   - (fw9) Classes:
     - the notice text equals sampleNotice;
     - the `.fw-sample` count equals sampleClasses.length, each with the visible text "Sample";
     - the `.fw-group` count equals the derived number of buildings in use. For each group: the h3 name, the address, the "N classes" text (singular rule), exactly one header Maps link, and a `.fw-class` count equal to the derived count. The sum equals sampleClasses.length;
     - every `.fw-class` is a BUTTON with type=button, aria-expanded false and a hidden panel. Its text contains "<day> <start>–<end> · <type>", the course and the room;
     - click the first class of each group: the panel is visible and holds the Course, Time and Type lines, the four decoded-room lines and one Maps link. Click again: closed.
   - (fw5b) Total Maps-link count in #v-firstweek with #fwRoomResult empty equals the sum of:
     - whoToAsk with mapsQuery;
     - firstDays where-entries with mapsQuery;
     - buildings with mapsQuery;
     - class groups that have a building;
     - sample classes whose room decodes.
   - (fwz3) Async steps after (fwz2), before (z-end). For every action of every firstDays item:
     - click First week, open that card if it is closed, click `#fwd-<i> button[data-view=<view>]` and tick;
     - assert #v-<view> has class "on" and getClientRects().length > 0, and #v-firstweek is not on;
     - the banner equals the Resources literal when the view is resources, and NOTE0 otherwise.
     Data cross-check: there is an action "Open Resources" with view resources and one "Open the Courses tab" with view matcher.
  </action>
  <verify>
    <automated>S=C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad; F=prototype/index.html; test "$(node "$S/res-tools/check-block-fixed.mjs" "$S/fw-final/firstweek-data.json" $F firstweek-data FIRSTWEEK_DATA)" = "EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses" && test "$(node "$S/res-final/check-embed.mjs" "$S/res-final/resources-data.json" $F)" = "EMBED OK steps=10 countries=38" && node "$S/res-tools/harness.mjs" && test "$(grep -v -e 'const RESOURCES_DATA' -e 'const FIRSTWEEK_DATA' $F | grep -c 'id="fwRoom"')" -ge 1 && test "$(grep -v -e 'const RESOURCES_DATA' -e 'const FIRSTWEEK_DATA' $F | grep -c 'id="fwRoomResult" aria-live="polite"')" -ge 1 && test "$(grep -v -e 'const RESOURCES_DATA' -e 'const FIRSTWEEK_DATA' $F | grep -c 'hasOwnProperty')" -ge 1 && test "$(grep -v -e 'const RESOURCES_DATA' -e 'const FIRSTWEEK_DATA' $F | grep -c 'fw-sample')" -ge 2</automated>
    Baselines (before-fw, data lines excluded): `id="fwRoom"` [HEAD=0 EXPECT>=1]; result region with aria-live [HEAD=0 EXPECT>=1]; hasOwnProperty [HEAD=0 EXPECT>=1]; fw-sample (CSS rule plus JS markup) [HEAD=0 EXPECT>=2]. RED step: before the implementation, the harness exits 1 with FAIL lines for (fw8) and (fw9).
  </verify>
  <done>Typing a room code and pressing Enter or Search shows the exact D-03 result. Building, wing, floor and room come from rooms.table only; unknown codes link to the official UPT map; empty input asks for a code. Sample classes are grouped by building with "N classes" and Maps links, each row is Sample-badged and opens to the decoded room. The action buttons open Resources or Courses with the correct banner. The harness passes everything, including (fw5b), (fw8), (fw9) and (fwz3), at both widths.</done>
</task>

<task type="auto">
  <name>Task 3: Full verification at 1440 and 390, real keys, screenshots, one fix pass, diff gates and SUMMARY</name>
  <files>prototype/index.html, .planning/quick/261121-tsc-first-week-tab-who-to-ask-first-7-days-b/261121-tsc-SUMMARY.md, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/page-tests.js, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/cdp-keys.mjs, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/make-shots.mjs, C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/diff-gate.mjs</files>
  <read_first>
    - SCRATCH/res-tools/page-tests.js: the (q)-(t) block (Grep `"(s) targets`; about lines 222-240 at planning time) and fwRun()
    - SCRATCH/res-tools/cdp-keys.mjs lines 1-40 and 75-101; make-shots.mjs; diff-gate.mjs
    - prototype/index.html: only the `/* first week */` CSS block and the first-week JS (Grep; skip both data lines)
  </read_first>
  <action>
1. Layout and accessibility checks (D-09). Add these to fwRun() as the last sync checks. First open every `.fw-head`, every `.fw-srcbtn` and every `.fw-class`, and run a found search (B426) so the result card is shown. Then:
   - (fw11) document.documentElement.scrollWidth <= innerWidth.
   - (fw12) Every visible `#v-firstweek .fw-head, .fw-srcbtn, .fw-class, .fw-act, .fw-mapbtn`, #fwRoom and the Search button is at least 44x44. Inline links inside sentences and quotes are exempt (WCAG 2.5.8 inline exception), as in (s).
   - (fw13) Contrast: the same algorithm as (t), over `#v-firstweek *` with own text and skipping `.res-vh`. Every ratio is at least 4.5 and more than 20 elements are checked. Also check getComputedStyle(#fwRoom,"::placeholder").color against the input background when it parses; record "skipped" in the name when it does not.
   Then close everything and clear the result, so the snapshot and later steps see the default state. The full-mode harness already runs everything at 1440 and 390, so these run at both widths.

2. Real keys (D-03, D-05, D-04). Extend cdp-keys.mjs. Insert after the Germany checks and before "no page errors during the keyboard run":
   - Add a typeText(str) helper. For each character it sends Input.dispatchKeyEvent keyDown with key, text, code ("Key"+upper-case letter or "Digit"+digit) and windowsVirtualKeyCode (the char code of the upper-case character), then keyUp, then sleeps 30ms.
   - Evaluate a click on the First week nav button and focus #fwRoom. typeText("b426"), key("Enter"):
     - #fwRoomResult contains "Wing: Corp B", "Floor: 4", "Room: B426" and the "Building: " line for the building derived in the page;
     - focus is still on #fwRoom.
   - Evaluate #fwRoom.value="". typeText("Z999"), Enter: the result contains "Not in our map yet".
   - Evaluate the value "" again. key("Tab"): the active element is the Search button. key("Enter"): the result matches /Type a room code/.
   - Focus #fwh-0 by evaluation. key("Enter"): it opens and focus stays on it. key("Space"): it closes. The computed outline is solid and at least 2px.
   - Focus the first `.fw-class`. key("Enter"): aria-expanded is true and its panel contains "Room: " plus that class's room.
   Run `node cdp-keys.mjs 1440` and `node cdp-keys.mjs 390`; both must exit 0.

3. Screenshots (impeccable: verify at the shipped sizes and batch the fixes).
   - Extend make-shots.mjs with two pages:
     - run/shot-fw.html: First week on load, then a B426 search and the first class row opened;
     - run/shot-fw-open.html: every `.fw-head` and `.fw-srcbtn` opened.
   - Run make-shots.mjs, then `sh .claude/skills/impeccable/scripts/impeccable shot <absolute run/shot-fw*.html> --viewport 1440x900,390x844 --full --out <SCRATCH>/res-tools/shots-fw` for each file, and Read the PNGs. If a 390 full-page image is too tall to read, add section-only pages the way make-cards.mjs does.
   - Look at:
     - the section rhythm (more space above an h2 than below it);
     - the office cards, and the Source button with its page tag;
     - the building list dividers and long Romanian names wrapping at 390;
     - the official-map button;
     - the room form row at 390 and the result card;
     - the group head, class rows, Sample badge and chevron alignment;
     - the banner wrapping at 390;
     - anything that does not match the Resources tab look.
   - Fix what one look shows in one batch, only inside the First week markup, the `/* first week */` CSS block or the first-week JS. Re-shoot once. Re-run both embed checks, the harness and cdp-keys.

4. Diff gate against before-fw. Extend diff-gate.mjs with an optional third argument `fw`. Without it, behaviour is unchanged. With `fw`, it uses these regions in the BEFORE file instead:
   - replace regions, where b>0 hunks are allowed:
     - nav: the single line containing `data-view="firstweek"`;
     - stub: the single line containing `<div class="view" id="v-firstweek">`;
   - insertion-only regions, where a hunk with b>0 FAILS:
     - css: [L, L], where L is the line before the first `</style>`;
     - data: [E+1, E+2], where E is the `/* resources-data:end */` line;
     - js: [R, R+1], where R is the line whose trim is `resBanner();`;
     - init: [I, I], where I is the line whose trim is `renderResources();`.
   - Keep the existing match rule. It allows a pure insertion after old line a when start-1 <= a <= end, which absorbs git's sliding of identical boundary lines.
   - Run `node <SCRATCH>/res-tools/diff-gate.mjs <SCRATCH>/index.before-fw.html prototype/index.html fw`. It must print DIFFGATE OK. Six hunks are expected (nav, css, stub, data, js, init), but any count passes when every hunk is inside a region.

5. HEAD gate (D-10). `git diff -U0 prototype/index.html` must remove exactly 4 lines: the Resources nav line, the Resources stub, the First week nav line and the First week stub. It must remove no other line. HEAD is still 77edd2f, `git rev-list --count 77edd2f..HEAD` is 0, and nothing is staged.

6. SUMMARY. Write .planning/quick/261121-tsc-first-week-tab-who-to-ask-first-7-days-b/261121-tsc-SUMMARY.md from the summary template. Do not commit. It states:
   - the harness pass count per viewport (old 231 versus new total), and the three pre-existing checks that were re-scoped on purpose: (a) badges, (z2) First week skipped, and (v) First week stub;
   - the cdp-keys counts at both widths;
   - the screenshots read and the fixes made;
   - the derived counts quoted from the check names: steps, offices, buildings per group, Maps links, tel and mailto counts, classes per group;
   - the check-block.mjs regex bug and the fixed copy used, with the original left untouched;
   - the banner mechanism: a second MutationObserver that restores only its own sentence, reuses resNoteHtml0 and edits no existing line;
   - the diff-gate hunks per region and the HEAD-gate result;
   - data observations, without changing any data:
     - "A5" (the AC Bachelor secretariat room named in Who to ask) is not a key in rooms.table, so it reads "Not in our map yet";
     - the key B129b has a lower-case suffix, so "B129B" typed in capitals is not found under the D-03 normalisation;
     - the roomBuilding source quotes are in Romanian, with English notes;
   - what was NOT verified: a human browser pass at laptop and phone width (still open), opening a Maps link in Google Maps, and whether web fonts loaded in headless runs;
   - the pre-existing `.mtabs` bar at 390, which was not touched;
   - that the changes are uncommitted on resources-tab.
  </action>
  <verify>
    <automated>S=C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad; F=prototype/index.html; test "$(node "$S/res-tools/check-block-fixed.mjs" "$S/fw-final/firstweek-data.json" $F firstweek-data FIRSTWEEK_DATA)" = "EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses" && test "$(node "$S/res-final/check-embed.mjs" "$S/res-final/resources-data.json" $F)" = "EMBED OK steps=10 countries=38" && node "$S/res-tools/harness.mjs" && node "$S/res-tools/cdp-keys.mjs" 1440 && node "$S/res-tools/cdp-keys.mjs" 390 && node "$S/res-tools/diff-gate.mjs" "$S/index.before-fw.html" $F fw && git diff -U0 $F > "$S/res-tools/run/diff-head-fw.txt" && test "$(grep '^-[^-]' "$S/res-tools/run/diff-head-fw.txt" | grep -c -e 'data-view="resources"' -e 'id="v-resources"' -e 'data-view="firstweek"' -e 'id="v-firstweek"')" -ge 4 && test "$(grep '^-[^-]' "$S/res-tools/run/diff-head-fw.txt" | grep -v -c -e 'data-view="resources"' -e 'id="v-resources"' -e 'data-view="firstweek"' -e 'id="v-firstweek"')" -eq 0 && test "$(git rev-parse --short HEAD)" = 77edd2f && test "$(git rev-list --count 77edd2f..HEAD)" -eq 0 && test -z "$(git diff --cached --name-only)" && test -f .planning/quick/261121-tsc-first-week-tab-who-to-ask-first-7-days-b/261121-tsc-SUMMARY.md</automated>
    Baselines (working tree = before-fw, 2026-11-21): removed HEAD lines that are one of the four nav or stub lines [HEAD=2 EXPECT>=4] (only four such lines exist, so >=4 means exactly those four); any other removed HEAD line [HEAD=0 EXPECT==0 GUARD MUTATION: editing showView, the delegate, the data-note, a Resources line, Settings or another view]; diff-gate fw-mode exit code [HEAD=0 EXPECT==0 GUARD MUTATION: any hunk outside the six First week regions; at HEAD the files are identical, so there are no hunks]; cdp-keys exit code at each width [HEAD=0 EXPECT==0 GUARD MUTATION: First week breaking the Resources tab order; it was 23/23 at the end of su9]; commits after 77edd2f [HEAD=0 EXPECT==0 GUARD MUTATION: any commit, D-10]; staged files [HEAD=0 EXPECT==0 GUARD MUTATION: git add, D-10]; SUMMARY file [HEAD=absent EXPECT==present].
    <human-check>End of task: the user opens prototype/index.html in a browser at laptop and phone width, opens First week, searches B426 and Z999, opens a First 7 days card, a Source disclosure and a class row, taps one Open in Maps link, and checks the banner text on First week and Resources.</human-check>
  </verify>
  <done>The harness (with (fw11)-(fw13) at 1440 and 390), cdp-keys at both widths, diff-gate fw mode and the HEAD gate all pass. The screenshots were read, with one fix batch and one re-shoot. The SUMMARY lists what was and was not verified and the data observations. HEAD is 77edd2f, and nothing is staged or committed (D-10).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| curated JSON -> page innerHTML | Names, places, hours, quotes, notes and class rows are rendered through innerHTML |
| student keyboard -> room lookup | Free text typed into #fwRoom is used as an object key and shown back |
| data `actions[].view` -> showView | A data value picks which view the existing delegate shows |
| page -> external sites | Maps, maps.upt.ro, upt.ro and media.upt.ro links open in new tabs |
| scratch raw folders -> executor shell | SCRATCH/research and SCRATCH/fw hold raw, partly unverified files and scripts |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-tsc-01 | Tampering | renderFirstWeek / fwRoomSearch innerHTML | medium | mitigate | Every data and typed string goes through esc(). inject-block escapes `<` in the JSON. Only http/https become new-tab anchors (resLink). tel: is linked only when phone matches `^\+\d{6,}$`. (fw6) and (fw7) assert the schemes |
| T-tsc-02 | Spoofing | Office hours, phones, addresses and room locations shown to students | high | mitigate | Data enters only through inject-block, and check-block-fixed deep-equals it. Rooms are decoded only by an exact own-key lookup, and the building only from roomBuildings.corps; a miss shows "Not in our map yet" plus the official map, never a guess. The D-08 banner and a Sample badge on every class mark the timetable as sample. Sources, quotes and Verified dates are shown |
| T-tsc-03 | Tampering | #fwRoom input as an object key (`__proto__`, `constructor`) | low | mitigate | `Object.prototype.hasOwnProperty.call(FW.rooms.table, code)`, maxlength 12, output through esc(). (fw8) tests `__proto__` |
| T-tsc-04 | Elevation of Privilege | target="_blank" links (reverse tabnabbing) | low | mitigate | Every new-tab anchor comes from resLink with rel="noopener". (fw7) asserts it |
| T-tsc-05 | Tampering | action buttons (data-view from data) | medium | mitigate | A button renders only when `#v-<view>` exists with class view; the value goes through esc(). (fw2) and (fwz3) assert the target view becomes visible |
| T-tsc-06 | Repudiation | data-note banner across Resources and First week | medium | mitigate | fwBanner restores only its own sentence and its observer is created after the Resources one. (fwz1)-(fwz3), (z1)-(z3) and the (v) .data-note snapshot against HEAD assert every switch |
| T-tsc-07 | Tampering | scripts in SCRATCH/research and SCRATCH/fw | medium | mitigate | Never read or run. Tools live only in SCRATCH/res-tools, SCRATCH/fw-final and SCRATCH/plan-probe/fix-cb.mjs |
| T-tsc-SC | Tampering | npm/pip/cargo installs | low | accept | Nothing is installed (D-09). Node built-ins and the installed Chrome only |
</threat_model>

<verification>
- check-block-fixed prints `EMBED OK FIRSTWEEK_DATA keys=meta,whoToAsk,firstDays,buildings,officialMap,roomBuildings,rooms,sampleNotice,sampleClasses`, and check-embed prints `EMBED OK steps=10 countries=38`.
- harness.mjs passes every check at 1440 and 390. That covers all Resources checks (three re-scoped on purpose), the persist runs, the (v) snapshot against HEAD for all other views, and (fw1)-(fw13), (fw5b) and (fwz1)-(fwz3), with 0 console errors.
- cdp-keys passes at 1440 and 390, including real typing of "b426" + Enter, Z999, the empty Search, and Enter/Space on a First 7 days card and a class row.
- diff-gate fw mode prints DIFFGATE OK against SCRATCH/index.before-fw.html. The HEAD diff removes exactly the 4 nav or stub lines.
- Screenshots at both widths were read, with one fix pass. HEAD is 77edd2f, nothing is staged, and no commit was made.
</verification>

<success_criteria>
- A student opens First week and sees, in order, what to do in their first 7 days, who to ask, where each building is, a room finder and their (sample) classes grouped by building.
- Every office and building with a maps query opens Google Maps in a new tab with the exact query. The official UPT map is one tap away. There is no embedded map.
- Typing B426 tells them: Electro building, Corp B, floor 4, room B426, with a Maps link. An unknown code sends them to the official map instead of a guess.
- The banner says where First week data comes from and that the timetable is a sample. Resources and all other views are unchanged. The tab meets WCAG 2.2 AA at 1440 and 390.
</success_criteria>

<output>
Create `.planning/quick/261121-tsc-first-week-tab-who-to-ask-first-7-days-b/261121-tsc-SUMMARY.md` when done (no commit, per D-10).
</output>
