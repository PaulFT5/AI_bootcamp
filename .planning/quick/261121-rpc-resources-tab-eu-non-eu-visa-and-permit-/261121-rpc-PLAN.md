---
phase: quick-261121-rpc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - prototype/index.html
autonomous: true
requirements:
  - QUICK-261121-rpc
user_setup: []

estimate:
  tokens: 110000
  raw_tokens: 110000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "The Resources nav button has no 'soon' badge and opens the Resources view; First week is still a stub and keeps its badge (D-01)"
    - "A labelled EU / EEA vs Non-EU radiogroup filters the steps, and the choice is restored after a reload through the existing store helper (D-02)"
    - "Visible steps are grouped 'Before you arrive' / 'After you arrive', numbered 1..N in visible order with no gaps, and every card is closed on load (D-02, D-03)"
    - "Each card header is a native button with aria-expanded and aria-controls; mouse click, Enter and Space open and close it, and the arrow rotates (D-03)"
    - "An open card shows summary, instructions, documents to bring, 'Where to go' blocks (address, opening hours, phone as text plus tel: link, Google Maps link built only from mapsQuery), then source link, quoted text and date verified; null fields show the 'Not published' text (D-04)"
    - "The 'Your embassy in Romania' card lists only the countries of the chosen filter; Germany and Turkiye show their missions; 'My country is not listed' shows the MAE fallback link (D-05)"
    - "The view starts with the notice 'Informational only. Verify with incoming@upt.ro' (D-06)"
    - "The embedded RESOURCES_DATA is deep-equal to SCRATCH/res-final/resources-data.json (verified, curated data): no hour, phone, address, deadline or quote is changed"
    - "Every other view renders the same innerHTML as HEAD, the console is clean, there is no horizontal scroll at 390px, controls are at least 44px, and text contrast is at least 4.5:1 (D-07)"
  artifacts:
    - path: prototype/index.html
      provides: "Resources view markup, scoped CSS, resources-data script block (RESOURCES_DATA), renderResources and toggleStep logic"
      contains: "resources-data:begin"
    - path: .planning/quick/261121-rpc-resources-tab-eu-non-eu-visa-and-permit-/261121-rpc-SUMMARY.md
      provides: "What was verified, what could not be, data gaps, conflicts count"
  key_links:
    - from: prototype/index.html
      to: prototype/index.html
      via: "nav button data-view=resources -> existing click delegate -> showView('resources') -> #v-resources"
      pattern: 'data-view="resources"'
    - from: prototype/index.html
      to: prototype/index.html
      via: "RESOURCES_DATA const in the resources-data script -> renderResources() -> #resList and #embResult"
      pattern: "renderResources"
    - from: prototype/index.html
      to: prototype/index.html
      via: "#v-resources change listener -> store.set('resAud') -> renderResources()"
      pattern: 'store.set("resAud"'
---

<objective>
Build the Resources tab in the single-file prototype (prototype/index.html): an EU / EEA vs Non-EU filtered, step-by-step arrival guide for Erasmus Studies students (Bachelor and Master). It covers visas, residence registration, offices and embassies. Steps are numbered, collapsible cards. Each card has per-office hours, phone and a Google Maps link. A country selector shows the student's own embassy in Romania.

Purpose: incoming students need correct paperwork steps in the right order. The content comes from researched official sources and is shown with its source, quote and date verified (PRODUCT.md principle 1 "Sources over assertions").

Output: an edited prototype/index.html (left uncommitted on branch `resources-tab`, per D-08) and the quick-task SUMMARY.

Requirement ID: this is a quick task with no ROADMAP requirement. `QUICK-261121-rpc` is its own ID. It previews the PAPER-01 citizenship split and the PAPER-05 source display in the prototype, but it does not complete either requirement.

Decision IDs: the orchestrator's locked user decisions are cited as D-01..D-08 (decision 1 = D-01 ... decision 8 = D-08):
- D-01 only prototype/index.html changes (plus this task's PLAN/SUMMARY); Resources and First week stay separate; First week stays a stub; remove only the Resources "soon" badge.
- D-02 filter is only EU/EEA vs Non-EU, labelled segmented control with radiogroup semantics; audience is Erasmus Studies, Bachelor and Master; renumber in visible order with no gaps; remember the choice with the prototype's existing try/catch store.
- D-03 numbered cards, closed by default, rotating arrow; disclosure buttons with aria-expanded/aria-controls; whole header clickable; keyboard operable.
- D-04 expanded card content and order; Google Maps URL format; "Not published. Confirm with incoming@upt.ro" (or the embassy contact page) for missing data; never guess.
- D-05 "Your embassy in Romania" step with a country select that follows the filter; per-mission details; fallback card linking the official MAE list.
- D-06 top notice "Informational only. Verify with incoming@upt.ro".
- D-07 same look and voice; English only; no new dependencies, no build step, no changes to other views; WCAG 2.2 AA (visible focus, 4.5:1, 44px targets, new-tab links with rel="noopener").
- D-08 no git commits, no push, no worktree; changes stay uncommitted on `resources-tab`.
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

Do NOT @-include or fully Read prototype/index.html (~732 lines, about 35k tokens). Read it in line ranges (see each task's read_first). After Task 1 the file holds one very long data line (the `const RESOURCES_DATA` line). Find it with Grep and skip it in every later Read.

Absolute paths used below (scratch folder, outside the repo):
- SCRATCH = C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad
- Verified data (read-only input, FINAL): SCRATCH/res-final/resources-data.json. It is the ONLY data file you may use. It was curated by the orchestrator: every quote was re-checked word for word against the page, and every embassy phone, hour, address and email was re-checked against the raw page it cites.
- Data tools (already written, do NOT rewrite): SCRATCH/res-final/inject-data.mjs and SCRATCH/res-final/check-embed.mjs. Your own tools go in SCRATCH/res-tools/ (built-in Node modules only). Never read, run or use anything inside SCRATCH/research (raw, partly unverified research files and scripts).
- Chrome: C:/Program Files/Google/Chrome/Application/chrome.exe (verified present at planning time)

Facts about the data (resources-data.json, 2026-11-21; the file may be refreshed later with more embassy data: re-run inject-data.mjs and check-embed.mjs, never edit data by hand):
- resources-data.json top keys: meta, steps, embassies, firstWeekCandidates, notIncluded. steps has 7 items, in display order: nomination-and-acceptance (all, before-arrival), health-insurance (all, before-arrival), non-eu-visa (non-eu, before-arrival), your-embassy (all, before-arrival, type "embassy-selector"), eu-registration-certificate (eu, after-arrival), non-eu-health-certificate (non-eu, after-arrival), non-eu-residence-permit (non-eu, after-arrival). Each step: id, audience, phase, title, summary, instructions[], bring[], note (string or null), deadline (string or null), optional deadlineEU, where[], source {url, quote (string or null), gloss, quoteLanguage, quoteVerified, verified, tier}, uncertainty (null).
- where[] items: name, kind (office|embassy|online), address, hours (string or null), optional hoursLines[] (array of strings), phone, optional phoneDisplay and phoneExtra, email, mapsQuery, url, optional urlLabel. Null means not published: never fill it in.
- embassies: { countries: [ { country, iso2, group ("eu"|"eea"|"non-eu"), evidence, hasData, missions: [ { name, city, kind (embassy|consulate|honorary-consulate|consular-agency), address, hours, phone, email, mapsQuery, whatFor[], source {url, verified} or null, note or null, hasVerifiedData } ] } ], fallback {label, url} }. 38 countries; only some have hasData true; the rest have missions whose fields are all null. Groups "eu" and "eea" both belong to the EU / EEA filter.
- Headless Chrome, 390px, impeccable-shot and Node facts below are from planning time and still hold.
- Headless Chrome `--dump-dom` runs page scripts and returns the final DOM. headless `--window-size` cannot go below about 500px wide. An iframe of width 390 inside a wrapper page gives a real 390px viewport (media queries apply and localStorage works). localStorage persists across two headless runs that share one `--user-data-dir`. Node is v22 (global fetch and WebSocket exist).
- `sh .claude/skills/impeccable/scripts/impeccable shot <absolute-file-path> --viewport 1440x900,390x844 --full --out <dir>` works on an absolute scratch path without a query string. It does not accept a query string.

Existing prototype patterns to reuse (line numbers at HEAD): tokens in :root (10-17); `.sem-tabs` segmented look (145-147); `.notice` (124); `.kv` definition grid (254-255); `.btn`/`.btn-quiet` (79-86); global `label`/`select` rules (93-95); nav markup (265-272); view stubs (368-371); `store` try/catch helper with "eupt2-" prefix (448-451); `$`, `esc`, `ICON` (459-468); `showView` (659-664); click delegate (678-699); init line (726-727).
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Tracer: embed the researched data and render filtered, numbered, closed step cards end to end</name>
  <files>prototype/index.html</files>
  <read_first>
    - prototype/index.html, in ranges only: 1-60, 120-150, 250-290, 355-392, 445-470, 655-731
    - .claude/skills/impeccable/reference/craft-floor.md (the impeccable skill requires reading it right before any UI edit)
    - .claude/skills/karpathy-guidelines/SKILL.md (surgical changes, nothing extra)
    - The data shape: see the facts above. Print keys and counts of SCRATCH/res-final/resources-data.json with a short node command. Do not Read the full JSON file into context.
  </read_first>
  <action>
Goal of the tracer: one thin path through every layer this task touches. Real data in the page, then filter, then storage, then numbered disclosure cards, then the existing view switcher. This path must be proven by a headless run before Task 2 adds detail.

1. Data block and adapter (data fidelity, per D-04 "never guess"). Insert a new, separate `<script>` element directly before the existing main `<script>` tag (line 388 at HEAD). It contains exactly three lines: `/* resources-data:begin */`, `const RESOURCES_DATA = null;`, `/* resources-data:end */`. Then run from the repo root: `node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/inject-data.mjs prototype/index.html C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/resources-data.json`. It replaces the middle line with the real data (one very long line). Never hand-type, reformat, translate or "fix" any data value: all data enters the HTML through this script.
   Then add the adapter as NEW lines at the very top of the existing main script (do not edit existing lines): `const RESOURCES = RESOURCES_DATA;` and `const EMBASSIES = { eu: { countries: <RESOURCES_DATA.embassies.countries whose group is "eu" or "eea">, fallback: RESOURCES_DATA.embassies.fallback }, "non-eu": { countries: <those whose group is "non-eu">, fallback: RESOURCES_DATA.embassies.fallback } };`. If RESOURCES_DATA is null, RESOURCES is null and EMBASSIES is null. The rest of this plan refers to RESOURCES.steps and EMBASSIES[resAud].countries and .fallback.

2. Embed check. Run `node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/check-embed.mjs C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/resources-data.json prototype/index.html`. It must print `EMBED OK steps=7 countries=38` (the counts may change if the data file is refreshed). If it fails, run inject-data.mjs again. Do not edit data by hand and do not write your own embed or check script.

3. Nav (D-01). Remove only the trailing soon badge span from the Resources nav button (line 270 at HEAD). Leave the Home page, Schedule and First week badges and the shared soon CSS rule as they are.

4. View markup. Replace only the Resources stub line (`<div class="view" id="v-resources">…`). Keep the view id and class. Inside, a wrapper with a new class `res` (max-width about 760px, like `.settings` limits its width) contains, in order:
   - `<h1>Resources</h1>`.
   - A `.muted` intro: "What to do before and after you arrive: visas, residence registration, offices and embassies. For Erasmus Studies students, Bachelor and Master." (D-02 audience; D-07 voice: short sentences, no idioms).
   - The D-06 notice, reusing the existing `.notice` class with role="note" and the same info-circle SVG as the Matcher notice. Text: "Informational only. Verify with incoming@upt.ro.", where the address is a mailto: link that opens in place.
   - The D-02 filter: a `<fieldset>` with a new class `res-seg`, `<legend>Your citizenship</legend>`, and two native radio inputs with name="resAud", value "eu" (label "EU / EEA") and value "non-eu" (label "Non-EU"). Each input is wrapped in its own `<label>`. Use native radios, not role="radio" buttons, because they give radiogroup semantics and arrow-key movement without extra code. Add one hint line under it: "EU / EEA means the 27 EU countries plus Iceland, Liechtenstein and Norway."
   - An empty `<div id="resList">`.
   First week, Home page and Schedule stubs stay exactly as they are (D-01).

5. State and render (D-02, D-03).
   - Add `let resAud` from `store.get("resAud", null)`, accepting only "eu" or "non-eu" (anything else becomes null). Check the matching radio when the page loads.
   - Discretion, recorded here: there is no default choice. With nothing stored, both radios are unchecked and #resList shows one `.muted` line, "Choose EU / EEA or Non-EU to see your steps." A Non-EU student is therefore never shown an EU-only list by default, which matters because wrong paperwork advice harms students.
   - Add a new function renderResources(). It takes RESOURCES.steps where audience is "all" or equals resAud, keeps the array order, and renders before-arrival steps under an `<h2>` "Before you arrive" and after-arrival steps under an `<h2>` "After you arrive". It reuses the existing global h2 label style and omits a heading whose group is empty. Numbers run 1..N across both groups in visible order, with no gaps.
   - If RESOURCES is null (missing file), render the line "Not published. Confirm with incoming@upt.ro" in place of the steps.
   - Pass every data string through the existing esc().

6. Card markup (D-03). One `<article class="res-step">` per step. Inside it is an `<h3>` (margin 0, font inherited) wrapping a `<button type="button" class="res-head" data-step id="rh-<i>" aria-expanded="false" aria-controls="rs-<i>">`. `<i>` is the step's index in RESOURCES.steps, which makes a stable and safe id. The button holds:
   - a number badge span (neutral: chip background, ink text, not teal, because teal marks actions only per COLOR-GUIDE rule 1);
   - the title span;
   - a chevron SVG with aria-hidden="true".
   The panel is `<div class="res-body" id="rs-<i>" hidden>`. In this task the panel holds only the step summary; Task 2 adds the full content. All cards are closed on every render.

7. Wiring.
   - Add a new function toggleStep(btn). It flips aria-expanded and the `hidden` property of the element named by aria-controls.
   - Add exactly one new line to the existing document click delegate chain: an `else if` branch for buttons with a data-step attribute that calls toggleStep(t). Insert it as a new line and do not edit existing lines.
   - Add one delegated `change` listener on #v-resources. When a radio named resAud changes, it sets resAud, saves it with store.set("resAud", value), and calls renderResources(). The filter fieldset is static HTML outside #resList, so focus stays on the radio.
   - Add a new line `renderResources();` directly after the existing init line `renderAll();renderProfile();`, without editing that line.

8. CSS. Add one new block, commented `/* resources */`, directly before `</style>`. Every selector starts with `#v-resources` or a new `res-` class, so no other view changes (D-07). Use :root tokens and hex values already in COLOR-GUIDE.md only; no new hues. Required:
   - The segmented control looks like `.sem-tabs`: a chip-coloured track with radius 7 and padding 3; the selected label has a white background and a subtle shadow, set with `:has(input:checked)`. The focus ring sits on the label via `:has(input:focus-visible)` and uses the accent outline. Each label has min-height 44px. The radio input is visually hidden but stays focusable (opacity 0, absolute position, 1px), never display:none. The fieldset and legend are reset inside the scope; the existing global `label` rule must be overridden only inside `.res-seg`.
   - Cards use a panel background, a 1px `--line` border and radius `--r`. Do not use overflow:hidden on the card, because it would clip the focus ring.
   - `.res-head` fills the full width of the header with left-aligned text and no background or border, min-height 44px (about 56px is the aim) and a gap of about 12px. Hover only changes the border colour.
   - The chevron rotates 180deg when `[aria-expanded="true"]`, with a transform transition of about .25s using `var(--ease)`. The existing global prefers-reduced-motion rule already disables it.
   - The number badge is a 28px circle using `--mono` digits.

9. Harness (tracer part). Create SCRATCH/res-tools/harness.mjs (built-ins only: fs, path, child_process) and SCRATCH/res-tools/page-tests.js (the in-page test code, inlined by harness.mjs). Run harness.mjs from the repo root. It must:
   - Read prototype/index.html and write SCRATCH/res-tools/run/work.html. Inject an error collector as the first child of `<head>` that records window error events, unhandledrejection, console.error and console.warn. Inject page-tests.js just before `</body>`, so it runs after the app script.
   - Write a wrapper page SCRATCH/res-tools/run/wrap-W.html for each viewport. The wrapper contains a `<pre id="harness-out">` and an iframe of size W×H loading work.html. The in-frame tests send one JSON result to the parent with postMessage, and the parent writes it into the pre.
   - Run Chrome as `chrome.exe --headless=new --disable-gpu --no-first-run --user-data-dir=<fresh dir under SCRATCH/res-tools/run> --window-size=1500,1000 --virtual-time-budget=5000 --dump-dom file:///<wrapper>`. Take the pre text from stdout, unescape &amp; &lt; &gt;, and parse it.
   - Print `PASS <check>` or `FAIL <check>: <detail>` per check, then `HARNESS <passed>/<total>`, and exit 1 if any check fails.
   Tracer checks, at 1440x900:
   - (a) Clicking the Resources nav button shows #v-resources and hides the others.
   - (b) With a fresh profile, both radios are unchecked and no .res-step exists.
   - (c) After a click on the Non-EU radio, the .res-step count equals the number of steps with audience all or non-eu. The badge numbers read 1..N with no gaps. Every header has aria-expanded="false" and every panel is hidden.
   - (d) A click on the first header opens it (aria-expanded true, panel not hidden); a second click closes it.
   - (e) localStorage "eupt2-resAud" holds the JSON string for non-eu.
   - (f) After switching to EU, the count and numbering are recomputed and have no gaps.
   - (g) The collected error and warning count is 0.
   Compute the expected numbers in the page from the RESOURCES global, not from hard-coded counts.
  </action>
  <verify>
    <automated>node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/check-embed.mjs C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/resources-data.json prototype/index.html && node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/harness.mjs && test "$(grep -c 'data-view="resources".*class="soon"' prototype/index.html)" -eq 0 && test "$(grep -c 'data-view="firstweek".*class="soon"' prototype/index.html)" -ge 1 && test "$(grep -c '<div class="view" id="v-firstweek"><h1>First week</h1></div>' prototype/index.html)" -ge 1 && test "$(grep -c 'resources-data:begin' prototype/index.html)" -ge 1</automated>
    Baselines (measured at HEAD on 2026-11-21): resources soon badge [HEAD=1 EXPECT==0]; firstweek soon badge [HEAD=1 EXPECT>=1 GUARD MUTATION: removing the First week badge]; firstweek stub line [HEAD=1 EXPECT>=1 GUARD MUTATION: editing the First week stub line]; resources-data marker [HEAD=0 EXPECT>=1]. check-embed.mjs asserts that RESOURCES and EMBASSIES are each declared exactly once; it parses the file and does not count lines.
  </verify>
  <done>check-embed prints EMBED OK, so the embedded data is deep-equal to the three files. The harness prints all tracer checks PASS with 0 console errors. Resources has no soon badge, First week is unchanged, and opening Resources, choosing a filter and opening or closing a numbered card works in headless Chrome. Nothing is committed (D-08).</done>
</task>

<task type="auto">
  <name>Task 2: Full card content, "Where to go" blocks with tel and Maps links, and the "Your embassy in Romania" country step</name>
  <files>prototype/index.html</files>
  <read_first>
    - prototype/index.html: only the Resources CSS block, the Resources view markup and the renderResources/toggleStep code written in Task 1 (use Grep for `/* resources */` and `renderResources` to find the line ranges; skip the two data lines)
    - prototype/index.html lines 251-256 (.syl and .kv patterns) and 223-224 (.linkbtn link styling)
    - For field shapes, print the step with id non-eu-residence-permit, and the DE and TR entries of embassies.countries from SCRATCH/res-final/resources-data.json, with a short node command, not a full Read.
  </read_first>
  <action>
1. Card body, in this order (D-04). Render each part only when its data is present, unless a fallback is named:
   - summary as a paragraph;
   - "Deadline:" label followed by the deadline text, when deadline is not null;
   - instructions as an ordered list, when the array is not empty;
   - "Bachelor and Master:" followed by bachelorMasterNote, when it is not null (D-02 audience);
   - "Documents to bring" heading and an unordered list of bring, when it is not empty;
   - "Where to go" heading and one block per where entry (point 2);
   - a "Not yet confirmed:" note with the uncertainty text, when it is not null. Style it with the warn tokens from COLOR-GUIDE: background #fff6dc, border #ecd28a, text #6b4d00;
   - the source block: a link with the text "Source: " plus the hostname of source.url; a `<blockquote cite="…">` with source.quote; "In English: " plus gloss, when gloss is not null; "Verified: " plus the verified string exactly as stored;
   - "More sources": one hostname link per extraSources item, followed by its note text, when the array is not empty.
   Discretion, recorded here: deadline, bachelorMasterNote, uncertainty, gloss and extraSources are shown because they hold exact deadlines and the researchers' own caveats, which PRODUCT.md principle 1 requires to be visible. source.tier, country evidence, the flagged list, weekOneCandidates and conflicts stay embedded but are not rendered. First week stays a stub (D-01). The SUMMARY lists how many conflicts exist.

2. "Where to go" block (D-04).
   - The entry name is in bold, followed by a kind label: "Office", "Embassy or consulate" or "Online".
   - For kind office or embassy, use the existing `.kv` definition grid with rows Address, Opening hours and Phone, plus an Email row only when email is not null (email as a mailto: link).
   - A null address, hours or phone shows the fallback text. For kind office: "Not published. Confirm with incoming@upt.ro", with the address as a mailto: link. For kind embassy: "Not published. Confirm on the embassy contact page", and the entry's url, when present, appears as its Website link.
   - Phone (D-04: visible text plus tel: link): show the stored phone string as it is. Wrap each dialable number found in it in a tel: anchor. A dialable number is an optional plus, then a digit, then six or more digits, spaces, dots, hyphens or parentheses, ending with a digit. Build its href by removing a literal "(0)" and then every character except digits and a leading plus.
   - Action row: "Open in Google Maps" only when mapsQuery is not null. Its href is exactly `https://www.google.com/maps/search/?api=1&query=` followed by encodeURIComponent(mapsQuery). Never build it from the address or the name (D-04 never guess). Add a "Website" link when url is not null.
   - For kind online: the name, an "Open the website" link to url, and email or phone only when present. No Address, Opening hours or Maps rows, because they do not apply to an online service (this is not missing data).

3. Link helper (D-07).
   - Write one small function for external links. Only http: or https: URLs become anchors; anything else is shown as plain escaped text.
   - Anchors get target="_blank" and rel="noopener", a visually hidden span " (opens in a new tab)" (a new scoped class such as `res-vh`, using the clip pattern, never display:none), and the existing ICON.ext wrapped in a span with aria-hidden="true". Do not edit the shared ICON object, because other views use it.
   - mailto: and tel: links open in place.
   - Action links (Maps, Website, Open the website, phone numbers, the fallback link) get a new class `res-act`: inline-flex, items centred, min-height 44px, accent colour with underline offset 3px, like `.linkbtn`. Links inside sentences or quotes keep normal inline styling.

4. Embassy step (D-05).
   - At execution, check whether a step title contains "embassy in Romania" (case-insensitive). If one does, put the selector in that card. Otherwise renderResources adds one UI-defined card titled "Your embassy in Romania" for both filters. It is the last card under "After you arrive" and is numbered in sequence. Its panel id is `rs-emb`, and it uses the same disclosure markup.
   - Card body: one sentence, "Choose your country to see its embassy and consulates in Romania."; then `<label for="embCountry">Choose your country</label>`; then a native `<select id="embCountry">`.
   - The select gets the existing form-control styling plus scoped min-height 44px and max-width about 360px. Its options:
     - first, an empty-value option "Select a country";
     - then EMBASSIES[resAud].countries sorted by country with localeCompare("en"). Each option's value is the country's index in the original array, and its text is the country name exactly as stored (for example "Turkiye");
     - last, value "other" with the text "My country is not listed".
   - Under the select is `<div id="embResult" aria-live="polite">`.
   - A filter change re-renders the list, which resets the select, because each group has different countries.

5. Country result.
   - Handle the select in the same delegated change listener from Task 1. Re-render only #embResult, never the list, so the card stays open and focus stays on the select.
   - A country with one or more missions gets one block per mission:
     - the name in bold;
     - a kind label made by replacing hyphens with spaces and capitalising the first letter (for example "Honorary consulate"), then " · " and the city;
     - `.kv` rows Address, Opening hours and Phone (plus Email when present), where null values show "Not published. Confirm on the embassy contact page";
     - the same phone tel: handling as point 2;
     - "Open in Google Maps" from mapsQuery only;
     - a "What they can help with" list, only when whatFor is not empty;
     - the note as muted text, when present;
     - a "Source: <hostname>" link to source.url and "Verified: <date>".
   - The "other" value, a country with zero missions, or a null group file shows a fallback card. Its text: "We have no checked details for this country yet. Find your embassy in the official list from the Ministry of Foreign Affairs of Romania (MAE)." After it comes a `res-act` link whose text is the fallback label and whose href is the fallback url. Take the fallback from EMBASSIES[resAud].fallback, else from the other group's fallback. If neither exists, show "Not published. Confirm with incoming@upt.ro".
   - The empty value shows nothing.

6. CSS, added only inside the existing `/* resources */` block, with the same scoping rules as Task 1:
   - spacing between body sections and between where blocks (a thin `--line` divider between blocks is fine);
   - section sub-headings in the `.drawer .tg h3` style (13px, bold, `--sub` colour);
   - a blockquote with a 3px `--line` left border, `--sub` text and margin 0;
   - overflow-wrap:anywhere on body text, list items and links, so long URLs, addresses and hours never cause horizontal scroll at 390px;
   - under the existing 760px breakpoint, the `.kv` grid inside #v-resources may switch to one column if the 390px check in Task 3 needs it.
   Follow craft-floor.md and D-07: calm and precise, no decorative teal, no new hues.

7. Extend SCRATCH/res-tools/page-tests.js with these checks, run at 1440x900:
   - (h) Open every visible card. Each one contains a link whose href equals its step's source.url, the quote text, and "Verified: " plus verified.
   - (i) Every Maps anchor href equals the base URL plus encodeURIComponent(q) for some q among the data's mapsQuery values, contains no raw space, and gives back q through new URL(href).searchParams.get("query").
   - (j) The number of "Not published" texts in the open cards equals the number derived from the data: null address, hours or phone in the visible where entries of kind office or embassy.
   - (k) Every tel: href matches `^tel:\+?\d{6,}$`.
   - (l) Every target="_blank" anchor in #v-resources has rel containing noopener, and every href starts with https:, http:, mailto: or tel:.
   - (m) With the EU filter, choosing the Germany option renders as many mission blocks as the Germany data has, and the consulate block shows the embassy fallback text.
   - (n) With the Non-EU filter, choosing the country whose iso2 is TR renders as many mission blocks as its data has. If TR is missing from the data, the harness reports that and expects the fallback card.
   - (o) The "other" value shows the fallback link, whose href equals the group's fallback.url.
   - (p) The embassy card number is N, the last number, with no gap.
   Find options by iso2 or "other" in the page, not by hard-coded index.

8. Curated-data field rules. These OVERRIDE any earlier point in this plan that conflicts with them.
   - Embassy step: the data already contains a step with type "embassy-selector" (title "Find your embassy in Romania", phase before-arrival). Put the country selector in that step's card, in its natural position. Do NOT add a UI-defined card. Check (p) becomes: the card of the step with type embassy-selector has a number equal to its position in the visible order, with no gap.
   - A step may have `note` (string or null): render it after the instructions as a muted paragraph with the label "Note:" (plain `--sub` text, no warning colour). `deadlineEU` (optional): when the filter is eu and deadlineEU is a string, show it instead of `deadline`. Steps have no bachelorMasterNote, no extraSources and a null uncertainty: render those parts only when present.
   - `source.quote` may be null (the embassy step): then render no blockquote and no "In English" line. Always show "Source: <hostname>" and "Verified: <date>" when source.url exists. When quoteLanguage is not "en" and gloss is present, show the gloss after the quote.
   - where[] entries: when `hoursLines` (array) is present, render it as a list in the "Opening hours" row and never show "Not published" for hours. Otherwise use `hours`. When `phoneDisplay` is present, show it as the link text and build the tel: href from `phone`; show `phoneExtra` as a muted line below. Use `urlLabel` (when present) as the website link text instead of the hostname.
   - Check (j): an office or embassy field counts as missing when address is null, or hours is null AND hoursLines is absent, or phone is null.
   - Embassies: all countries of the chosen group appear in the select. A country with hasData false shows the fallback card instead of mission blocks. A mission whose source is null shows no source row. A mission `note` is shown as muted text. Kind labels: embassy -> "Embassy", consulate -> "Consulate", honorary-consulate -> "Honorary consulate", consular-agency -> "Consular agency".
   - Harness checks (m) and (n): derive every count from the data. Germany (iso2 DE) and Turkiye (iso2 TR) have hasData true and 2 missions each. The EU group also contains countries with hasData false: for one of them, check that the fallback card renders. `firstWeekCandidates` and `notIncluded` are embedded and not rendered.
  </action>
  <verify>
    <automated>node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/check-embed.mjs C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/resources-data.json prototype/index.html && node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/harness.mjs && test "$(grep -c 'google.com/maps/search/?api=1&query=' prototype/index.html)" -ge 1 && test "$(grep -c 'rel="noopener"' prototype/index.html)" -ge 1 && test "$(grep -c 'id="embCountry"' prototype/index.html)" -ge 1</automated>
    Baselines (HEAD, 2026-11-21): maps base URL [HEAD=0 EXPECT>=1]; rel="noopener" [HEAD=0 EXPECT>=1]; embCountry [HEAD=0 EXPECT>=1].
  </verify>
  <done>Every open card shows the D-04 content in order, with source, quote and date verified. Maps links match the exact encoded format. Null fields show the correct "Not published" text. Phones show as text plus tel: links. The embassy card follows the filter: Germany shows 2 missions, Turkiye shows its missions, and "My country is not listed" links to the MAE list from the data. Harness checks (a) to (p) pass with 0 console errors, and check-embed still prints EMBED OK.</done>
</task>

<task type="auto">
  <name>Task 3: Browser verification at desktop and 390px, regression check against HEAD, fixes, and SUMMARY</name>
  <files>prototype/index.html, .planning/quick/261121-rpc-resources-tab-eu-non-eu-visa-and-permit-/261121-rpc-SUMMARY.md</files>
  <read_first>
    - SCRATCH/res-tools/harness.mjs and page-tests.js (from Tasks 1-2)
    - prototype/index.html: only the Resources CSS block and the Resources JS (find them with Grep; skip the two data lines)
  </read_first>
  <action>
1. Extend the harness into the full matrix.
   - Run every check from Tasks 1-2 in both a 1440x900 and a 390x844 iframe, with both filters.
   - (q) Assert the frame's innerWidth is the intended width, so the 390 run is a real 390px viewport.
   - (r) With Resources open, all cards open and a country chosen, document.documentElement.scrollWidth is at most innerWidth, for both filters and both widths.
   - (s) Every `.res-head`, every `.res-seg label`, #embCountry and every `.res-act` has a bounding box at least 44px high and 44px wide.
   - (t) For every element inside #v-resources with its own non-blank text node, the WCAG contrast between its computed colour and the first non-transparent background up the ancestor chain is at least 4.5.
   - (u) Persistence: a second headless run that shares the first run's user-data-dir loads work.html with the query string `?persist`. Chrome accepts the query on file URLs, the impeccable tool does not. The run asserts that the Non-EU radio is checked and the Non-EU list renders without any click.
   - (v) Regression for D-07: harness.mjs writes SCRATCH/res-tools/run/head.html from `git show HEAD:prototype/index.html`, with the same collector and a snapshot test, and runs it with a fresh profile. It does the same for work.html with `?snapshot`. Then it asserts the innerHTML of #v-matcher, #v-catalogue, #v-la, #v-settings, #v-home, #v-schedule, #v-firstweek, .mtabs, #drawer, #printView and .data-note is identical in both. It also asserts that after clicking the Courses, Catalogue, Schedule and First week nav buttons, and Settings in the account menu, the visible `.view.on` id is the same in both. Finally #v-firstweek innerHTML must be exactly `<h1>First week</h1>`.
   - (w) Console errors and warnings stay at 0 in every run.

2. Screenshots, checked by eye (impeccable skill: verify the rendered result at the sizes it ships at).
   - Write SCRATCH/res-tools/run/shot-eu.html and SCRATCH/res-tools/run/shot-noneu.html. Each is a copy of work.html with an auto-open script: open Resources, set the filter, open every card, and choose Germany (EU) or the TR country (Non-EU). The script runs synchronously after the app script.
   - Run `sh .claude/skills/impeccable/scripts/impeccable shot <file> --viewport 1440x900,390x844 --full --out SCRATCH/res-tools/shots`, then Read the PNGs.
   - Fix what one look shows, in one batch, then take one more set of screenshots: spacing, hierarchy, wrapping, focus clipping, anything that does not match the Courses, Catalogue and Settings look (D-07).

3. Real input.
   - If this session has a browser tool (Claude in Chrome or the built-in browser), open prototype/index.html at desktop width and at about 390px and do a manual pass:
     - click both filter options, and use the arrow keys inside the radiogroup;
     - Tab to a card header and press Enter, then Space, and confirm it opens, closes and keeps a visible focus ring;
     - Tab to the select and choose with the keyboard: an EU country, Turkiye, and "My country is not listed";
     - open one Maps link and confirm Google Maps searches for the right place;
     - confirm the console is clean.
   - If no browser tool is available, write SCRATCH/res-tools/cdp-keys.mjs. It launches Chrome headless with --remote-debugging-port and a scratch profile, finds the page websocket through fetch to /json/list, connects with Node 22's global WebSocket, and navigates to the 1440 wrapper or work.html. It sends real Tab, Enter and Space presses with Input.dispatchKeyEvent, reads document.activeElement and aria-expanded through Runtime.evaluate, and asserts that the first header opens on Enter and closes on Space, and that the radios change with ArrowRight.
   - If neither path works, write in the SUMMARY that real key presses were not verified, and that the harness only confirmed native button and radio semantics.

4. Fixes. Fix anything found only inside the Resources markup, the `/* resources */` CSS block or the Resources JS. Run check-embed and the harness again until every check passes. Never change a data value to make a check pass. A data problem is reported in the SUMMARY.

5. Diff gate (D-01, D-07). `git diff -U0 prototype/index.html` must show exactly 2 removed lines: the Resources nav button line and the Resources view stub line. Everything else must be added lines.

6. SUMMARY (no commit, no push, per D-08). Write .planning/quick/261121-rpc-resources-tab-eu-non-eu-visa-and-permit-/261121-rpc-SUMMARY.md from the summary template. It states:
   - what was verified and how (harness checks with pass counts per viewport, screenshots taken, manual or CDP keyboard pass), and what could not be verified;
   - the embed counts and any WARNING lines from embed.mjs, any missing or partial file, and the extra research files that were not used;
   - the notIncluded list in resources-data.json (embedded, not rendered), and that firstWeekCandidates were left for First week;
   - the discretion choices: no default filter choice; deadline, BM note, uncertainty, gloss and extraSources rendered; the embassy card added as the last "After you arrive" step;
   - a follow-up for the user: the global data-note banner says contacts are invented, which does not hold for the researched Resources data. The banner was not changed, because it is outside this task's scope (D-01, D-07);
   - that changes are uncommitted on branch resources-tab.
  </action>
  <verify>
    <automated>node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/check-embed.mjs C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-final/resources-data.json prototype/index.html && node C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/harness.mjs && git diff -U0 prototype/index.html > C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/run/diff.txt && test "$(grep '^-[^-]' C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/run/diff.txt | grep -c -e 'data-view="resources"' -e 'id="v-resources"')" -ge 2 && test "$(grep '^-[^-]' C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/run/diff.txt | grep -v -c -e 'data-view="resources"' -e 'id="v-resources"')" -eq 0 && test -f .planning/quick/261121-rpc-resources-tab-eu-non-eu-visa-and-permit-/261121-rpc-SUMMARY.md && git log --format=%h 8fe945a..HEAD -- prototype/index.html > C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/run/commits.txt && test ! -s C:/Users/serba/AppData/Local/Temp/claude/b7f5190c149b65e3/f77945db-1835-4f83-81ab-1787bb17d99f/scratchpad/res-tools/run/commits.txt</automated>
    Baselines (HEAD, 2026-11-21): removed diff lines that are the Resources nav or stub line [HEAD=0 EXPECT>=2]; removed diff lines that are anything else [HEAD=0 EXPECT==0 GUARD MUTATION: editing any existing line other than the Resources nav button and the Resources stub]; SUMMARY file [HEAD=absent EXPECT==present]; commits touching prototype/index.html after 8fe945a, the last commit that touched it [HEAD=0 EXPECT==0 GUARD MUTATION: any commit of prototype/index.html, which D-08 forbids].
    <human-check>End of task (human_verify_mode=end-of-phase): the user opens prototype/index.html in their browser, goes to Resources on a laptop and at phone width, and confirms the look matches the other tabs.</human-check>
  </verify>
  <done>The harness passes every check, (a) to (w), at 1440 and 390 for both filters, including persistence, regression against HEAD, overflow, 44px targets, contrast and a clean console. Screenshots were reviewed and the issues found were fixed. Real keyboard input was verified, or the SUMMARY says it was not. The diff removes exactly the 2 expected lines. The SUMMARY lists what was and was not verified, the data gaps and the follow-ups. Nothing is committed (D-08).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| research JSON -> prototype HTML | Strings collected from the web by research agents are embedded into a script block and rendered through innerHTML |
| page -> external sites | Links open UPT, government, embassy and Google Maps pages in new tabs |
| research folder -> executor shell | The folder also holds third-party helper scripts and downloaded pages |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-rpc-01 | Tampering | renderResources / where and mission blocks (innerHTML) | medium | mitigate | Every data string goes through the existing esc(). The embed script replaces each `<` with its JSON escape, so a `</script>` in the data cannot close the tag. Only http/https values become href (plus generated mailto: and tel:). Harness check (l) asserts the href schemes. |
| T-rpc-02 | Spoofing | Office hours, phones, addresses, deadlines shown to students | high | mitigate | Data enters only through embed.mjs, never retyped. check-embed deep-equals it against the source files. Null fields show "Not published. Confirm with incoming@upt.ro" or the embassy contact page fallback. Every card shows source link, quote and date verified. The top notice says "Informational only". Maps URLs are built only from mapsQuery. |
| T-rpc-03 | Elevation of Privilege | target="_blank" links (reverse tabnabbing) | low | mitigate | Every new-tab anchor gets rel="noopener"; harness check (l) asserts it. |
| T-rpc-04 | Information Disclosure | localStorage key eupt2-resAud | low | accept | Stores only "eu" or "non-eu" on the student's own device through the existing try/catch store. It is not sent anywhere. |
| T-rpc-05 | Tampering | Helper scripts in the research folder (gen.js, dump-pages.mjs, verify-*.mjs) | medium | mitigate | Never run them. The executor's tools live in SCRATCH/res-tools and read the three JSON files by path only. |
| T-rpc-SC | Tampering | npm/pip/cargo installs | low | accept | This plan installs nothing (D-07: no new dependencies, no build step). All tools use Node built-ins and the installed Chrome. |
</threat_model>

<verification>
- check-embed.mjs prints EMBED OK: the embedded RESOURCES and EMBASSIES are deep-equal to steps.json, embassies-eu.json and embassies-non-eu.json.
- harness.mjs prints HARNESS n/n with all checks (a) to (w) passing at 1440x900 and 390x844, for both filters, with 0 console errors or warnings.
- The other views' innerHTML is identical to HEAD (check v), and First week is still `<h1>First week</h1>` with its soon badge.
- `git diff -U0 prototype/index.html` removes exactly the Resources nav line and the Resources stub line.
- Screenshots at both widths were reviewed. The keyboard was checked with real key events, or the SUMMARY reports that it was not.
- No commit and no push were made (D-08).
</verification>

<success_criteria>
- A student opens Resources, picks EU / EEA or Non-EU, and sees only their steps, numbered 1..N with no gaps and closed by default. The choice is remembered.
- Opening a card shows plain-English instructions, documents, the offices with address, hours, phone (tel:) and a correctly encoded Google Maps link, and the official source with quote and date. Missing values say "Not published" with a contact; nothing is guessed.
- "Your embassy in Romania" shows the chosen country's missions. An unlisted country gets the official MAE list.
- Courses, Catalogue, Settings, Schedule, Home page and First week are unchanged. The page meets the D-07 accessibility rules at desktop width and at 390px.
</success_criteria>

<output>
Create `.planning/quick/261121-rpc-resources-tab-eu-non-eu-visa-and-permit-/261121-rpc-SUMMARY.md` when done (no commit, per D-08).
</output>
