# Feature Research

**Domain:** English-first onboarding assistant for incoming Erasmus+ students at UPT (AI course matcher for Learning Agreements + paperwork checklist + cross-year/cross-faculty schedule builder)
**Researched:** 2026-11-20 (today); demo Sunday 2026-11-22
**Confidence:** MEDIUM-HIGH on features and on the paperwork facts. MEDIUM on data-source usability: the *current* catalogue and the *current* AC timetable sit behind SharePoint sign-in and could not be fetched from here.

> Method note: every URL in "Data Sources" was fetched (HTTP status recorded) from this machine on 2026-11-20 unless marked "not fetched". The 2021-22 .xls catalogue files and several timetable files were downloaded and parsed, so the structure claims for those are first-hand.

---

## Feature Landscape

### Table Stakes (Users Expect These)

#### Module 1 - Course Matcher (priority 1)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Searchable/browsable UPT course list (filter by faculty, level, semester, English status) | Every exchange portal has a catalogue browser; the matcher needs the same data anyway | LOW | Free by-product of ingestion. Filter columns exist in the source (see Data Sources #1). |
| Home-course input form (name, free-text description, ECTS, optional home level/year) | Core Value of the project | LOW | Plain form. Allow adding several courses at once (a student brings 5-8). |
| Ranked UPT matches with similarity score + short reason | Stated Core Value; it is what makes this more than keyword search | MEDIUM | Embeddings for top-N recall, then Claude to rerank and write a 1-2 sentence reason. Research shows pure cosine ranking cannot decide equivalence on its own, and LLMs tend to over-score similarity, so show the score as "match strength" and add a "needs coordinator approval" disclaimer. |
| Match card shows ECTS, semester, year, faculty, programme, English status | Student needs this to fit a Learning Agreement line | LOW | All fields exist in the catalogue except faculty, which comes from the file name. |
| English status as a visible badge with the three real catalogue levels: (a) taught in English, (b) English teaching materials, (c) individual study in English possible | The project's stated differentiator and the #1 student worry. The catalogue has these as separate columns. | LOW | Do not collapse them into one boolean. See Data Sources #1. |
| Save matches into a "Learning Agreement draft" list (add/remove) with running ECTS total | Stated requirement; the LA is the actual deliverable | LOW-MEDIUM | Needs accounts. Table A shape: home course, UPT course, semester, ECTS. |
| Semester filter that keeps only courses offered in the mobility semester | UPT states students "may choose only courses offered in the semester in which the mobility is expected to take place" | LOW | The `Semester` column is odd/even (1,3,5.. = autumn; 2,4,6.. = spring). |
| Copy / print / export the LA draft (CSV or printable page) | The student must paste it into OLA or a PDF | LOW | Printable HTML plus CSV is enough. Do NOT attempt to submit to OLA. |
| Disclaimer that final approval is by the home coordinator and the UPT host-faculty coordinator | Wrong academic advice causes real harm | LOW | Show the UPT host-faculty coordinator per faculty (listed in Data Sources #5). |

#### Module 2 - Paperwork and Legal Assistant (priority 2)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 4-question onboarding (citizenship, KA131/KA171, study/traineeship, arrival date) | Stated requirement | LOW | Citizenship and KA131/KA171 overlap in practice. The UPT page splits on *sending-country group* (Programme countries = KA131, partner countries = KA171), not on EU vs non-EU. Derive KA from the home country if possible. |
| Personalised pre-arrival + Week-1 checklist built from a rules table | Core of the module; the Erasmus+ App itself is "interactive checklists" | MEDIUM | Author the content as a JSON/YAML rules table (item, condition, offset/deadline, source URL). Do not generate it with an LLM. |
| Tick-off with persisted progress | Stated requirement | LOW | One table: user_id, item_id, done_at. |
| Date-aware deadlines (relative to arrival date and the fixed nomination dates) | Students ask "what do I do now" | LOW-MEDIUM | Fixed dates from the UPT page: KA131 nominations 18 Jun (autumn) / 10 Dec (spring). KA171: 30 Jun / 30 Nov. Today (20 Nov) a spring KA171 student is 10 days from the deadline, a good demo moment. |
| Source link on every checklist item (to the exact upt.ro page) | Project constraint: content must come from official guides | LOW | Store `source_url` per item and show "Source: international.upt.ro" under each. |
| Dependencies between items (acceptance letter before visa; visa before registration) | Stated requirement | LOW-MEDIUM | Item `requires: [ids]`; grey out blocked items. |
| Arrival-day card: dorm 11C hours, key pickup at 8C after hours, Rectorate Office 107 registration hours | Stated in PROJECT.md and confirmed on the official page | LOW | Facts are in Data Sources #5. Registration is Mon-Thu 12:00-15:30, Fri 11:00-13:00. Dorm arrival is Mon-Fri 08:00-16:00. |
| Money facts: 450 RON/month rent by card only, 600 RON cash deposit (refundable) | Stated and confirmed. Students need cash on arrival. | LOW | Do not mix with the 550 RON/month figure, which is for degree-seeking non-EU students (different page). |
| Campus utilities cards: canteen, sports complex, library card desk, student polyclinic | Stated requirement | LOW | Static content. Sources and gaps in Data Sources #7. |
| "Not legal advice, verify with incoming@upt.ro" footer and contact block | Harm avoidance | LOW | Include both case handlers named on the page (KA131 vs KA171 contact). |

#### Module 3 - Cross-Year Schedule Builder (priority 3)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Weekly grid with courses from different years and faculties on one calendar | Stated; UPT itself warns about cross-programme overlaps | MEDIUM | Needs a normalised `Slot` model: course, type (C/S/L/P), day, start, end, room, group/subgroup, week-parity or week-range, faculty. |
| Overlap detection (red clash markers) | Every schedule builder blocks or flags conflicts | MEDIUM | Interval overlap per day, parity-aware: an odd-week slot and an even-week slot of the same hour do NOT clash. |
| Odd/even week handling | Stated requirement; present in real UPT timetables | MEDIUM-HIGH | The data is free text, not a field (see Data Sources #3). Needs a parser or LLM normaliser mapping "sapt. impara", "Săpt.imp.", "p/i", "sapt. 1-10", "(sapt. 1,2,3,4)" to `{parity | weeks[]}`. |
| Choosing a lab subgroup/semigroup per course | Real timetables have 1.1/1.2/2.1/2.2 (AC) or semigrupa 1/2 (MEC) | MEDIUM | UI: for each course show the available lab slots as radio buttons; the clash checker greys out slots that collide with chosen ones. |
| .ics export | Stated; Calgary, Michigan and Cornell builders all export iCal | MEDIUM | Needs semester start/end dates + RRULE with parity (INTERVAL=2) and EXDATEs for holidays. Use the UPT academic calendar (Data Sources #4). Keep to one VTIMEZONE (Europe/Bucharest). |
| Mobile-friendly day view | Students look at schedules on the phone | LOW-MEDIUM | Responsive list per day. A pure grid is poor on phones. |

---

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Explained match with evidence** (keywords overlap + short LLM rationale + "what is missing at UPT vs your home course") | Coordinators need a reason, not a score; existing tools only offer a name search | MEDIUM | The catalogue gives 10 bilingual keywords per course, which is high-signal embedding text. |
| **English-first filter combined with matching** ("only show courses I can take in English") | Fixes the biggest friction: the catalogue is bilingual, and about 83% of rows are taught in Romanian | LOW | Default toggle = on. Show how many hits were dropped. |
| **Matcher feeds the scheduler** (saved LA courses auto-load as the schedule's course list) | No existing tool links "choose courses" to "will they fit". UPT's own page warns of this problem and leaves it to the student. | MEDIUM | Needs a mapping UPT catalogue course -> timetable slot(s) by name and year (fuzzy). Expect manual seeding for the demo (3-5 courses). |
| **Clash-free subgroup suggestion** (greedy/backtracking over lab slot options) | Stated requirement; solves the actual pain of cross-year schedules | MEDIUM | Small search space: backtracking, no solver needed. |
| **AI schedule extractor** (PDF / screenshot / pasted text -> normalised slots via Claude vision) | Handles PDF/XLSX/Google-Sheet variety across 10 faculties without writing 10 parsers | HIGH | The demo killer, but also the biggest risk. Mitigate: pre-extract and cache 3-4 real files as seed JSON, and keep the live upload as a "try it" path with a human-reviewable result table. |
| **Room-code decoder** ("B410 = Electro complex, building B (7-floor block), floor 4") with a map link | Romanian-only signs and codes are a stated pain point | MEDIUM | The AC timetable ships an official room legend (Data Sources #3); the MEC legend states "N205 = new building, floor 2". Build a small prefix table (A/B/C/D/N/M/ASPC/SPM/Orol/PN/CP) and link to the campus map PDF. Do not try to render floor plans. |
| **Plain-English LA change window reminder** (30 days to amend "During the mobility" LA) | Typical missed deadline; UPT states it explicitly | LOW | A checklist item with a computed date. |
| **Citations on checklist content** (every item shows the quoted sentence from the official page) | Trust; counters generic AI advice | LOW | Store the quote text with the item. |
| Stretch: RAG chatbot over mobility guides with exact citations | Edge-case questions | HIGH | Defer. The studies page is short enough (about 3.5k words) that "stuff the page into the prompt and cite the heading" beats a vector index for a demo. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Live scraping of upt.ro / SharePoint / Google Sheets at request time | "Always up to date" | Sources are SharePoint (sign-in), Google Sheets and ad-hoc PDFs with no stable schema. They change names every semester. 2 days to demo. | Pre-process once into versioned JSON in the repo; show "data as of" date. |
| Auto-submitting or signing the Learning Agreement / OLA integration | "End-to-end" | OLA / Erasmus Without Paper needs institutional credentials and is signed by three parties. | Export a clean LA table to paste into OLA. |
| Claiming "official equivalence" | Sounds authoritative | Equivalence is decided by the coordinators; LLMs over-score similarity (research shows pure cosine/LLM scores are poorly calibrated). | Label as "suggested match", add the coordinator contact. |
| UPT SSO / student portal login | "See my real timetable" | Students have no UPT credentials before registration (out of scope in PROJECT.md). | Own accounts. |
| Generating checklist items with an LLM at runtime | Faster to build | Hallucinated legal steps harm students. | Hand-authored rules table with source URLs. |
| Full interactive indoor campus map / turn-by-turn | Looks impressive | Needs geodata UPT does not publish. | Room-code decoder + link to the official campus map PDF and Google Maps pin of the building. |
| Non-English UI, push notifications, native mobile | "Reach more students" | Explicitly out of scope; a colleague builds mobile. | Responsive web only. |
| Rendering/parsing every faculty's timetable format | "Cover all faculties" | 10 faculties, 6 different storage systems. | Seed 3-4 faculties (see MVP). Generic AI extractor covers the rest on demand. |
| Course reviews/ratings, chat/community, roommate matching | Social features | Moderation burden, no data, no demo value. | Link to ESN Timisoara and the faculty/ESN channels. |

---

## Feature Dependencies

```
Accounts/auth
    ├──requires──> Saved LA draft (Module 1)
    ├──requires──> Checklist progress (Module 2)
    └──requires──> Saved schedule (Module 3)

Catalogue ingestion (xls -> normalised JSON)
    └──requires──> Course browser
    └──requires──> Embeddings index
                       └──requires──> Ranked matches + reason
                                          └──requires──> Saved LA draft
                                                             └──enhances──> Schedule builder (auto-load courses)

Timetable seed data (normalised Slot JSON)  <──produced by── AI schedule extractor OR hand-seeding
    └──requires──> Weekly grid
                       └──requires──> Overlap detection
                                          ├──requires──> Parity parser (odd/even/week ranges)
                                          └──requires──> Subgroup selection ──requires──> Clash-free suggestion
    └──requires──> Room-code decoder (needs only the room string, independent of the grid)
    └──requires──> .ics export (needs semester dates from the academic calendar + parity)

Checklist rules table (hand-authored)
    └──requires──> 4-question onboarding ──requires──> Personalised checklist ──requires──> Tick-off persistence
                                                              └──enhances──> Date-aware deadlines (arrival date)

RAG chatbot ──enhances──> Checklist (reuses the same source pages)   [stretch]
AI schedule extractor ──conflicts──> "Exact" data accuracy unless a human review table follows it
```

### Dependency Notes

- **Everything in Module 3 needs the `Slot` schema first.** Decide it in the first hour (course, type, day, start, end, room, group, subgroup, parity/weeks, faculty, program, year) and make both the extractor and hand-seeding target it.
- **Matcher -> scheduler is the only cross-module link.** Keep it a join on the course name plus year; if the join fails, the user picks the slot course manually. Do not block Module 3 on it.
- **Module 2 has no dependency on Modules 1 or 3.** It can be built by a second pair of hands in parallel; it is mostly content authoring.
- **.ics export needs parity** to be correct. Without it, every "odd week" slot would be exported weekly.
- **Extractor vs seed data:** both produce the same `Slot` JSON. Always build the seed path first; the extractor is an optional producer.

---

## MVP Definition

### Launch With (v1 / Sunday demo)

- [ ] Catalogue ingestion from the xls files into one normalised JSON + embeddings (Module 1 foundation)
- [ ] Matcher: form -> top 5 ranked with score, reason, ECTS/semester/faculty/English badge
- [ ] Saved LA draft with ECTS total, copy/print export
- [ ] Accounts (simplest viable: email+password or magic link; persist the three artefacts)
- [ ] Paperwork: 4-question onboarding, rules-table checklist with ~25 hand-authored items, sources, persistence
- [ ] Campus utilities static page (dorm, canteen, sports, library, polyclinic)
- [ ] Schedule: weekly grid, overlap detection with parity, subgroup picker, .ics export on 3-4 pre-extracted real timetables (one AC Google-Sheet semester, one MEC PDF, one MPT or SC xlsx, one CT PDF)
- [ ] Room-code decoder using the official legend

### Add After Validation (v1.x)

- [ ] Live AI extractor for user-uploaded PDF/screenshot with review table (if not done for Sunday, ship it as a "beta" panel using the cached samples)
- [ ] Matcher-to-scheduler auto-load
- [ ] RAG chatbot with citations
- [ ] Newer catalogue (2025-26 / 2026-27) once downloaded manually from SharePoint

### Future Consideration (v2+)

- [ ] Coordinator-facing view (approve a match, export LA PDF)
- [ ] Trainee-specific flow (host-company paperwork)
- [ ] Romanian UI

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Catalogue ingestion + normalisation | HIGH | MEDIUM | P1 |
| Ranked matches + reason + badges | HIGH | MEDIUM | P1 |
| LA draft + export | HIGH | LOW | P1 |
| Accounts + persistence | HIGH | LOW-MEDIUM | P1 |
| Checklist rules table + onboarding | HIGH | MEDIUM (content) | P1 |
| Tick-off + dependencies + deadlines | HIGH | LOW-MEDIUM | P1 |
| Campus utilities page | MEDIUM | LOW | P1 |
| Weekly grid + overlap + parity | HIGH | MEDIUM-HIGH | P1 |
| Subgroup picker / clash-free suggestion | MEDIUM-HIGH | MEDIUM | P2 |
| .ics export | MEDIUM-HIGH | MEDIUM | P2 |
| Room-code decoder | MEDIUM | LOW-MEDIUM | P2 |
| AI schedule extractor (live) | HIGH wow, MEDIUM real value | HIGH | P2 (seed first) |
| Matcher -> scheduler link | MEDIUM | MEDIUM | P3 |
| RAG chatbot | MEDIUM | HIGH | P3 |

**Priority key:** P1 must have for demo. P2 should have, cut first if time is short. P3 only if time remains.

---

## Competitor / Analogue Feature Analysis

| Feature | Erasmus+ App / OLA / ESN | Generic schedule builders (Calgary, Michigan, Cornell) | AI articulation research (SUNY, SFSU) | Our Approach |
|---------|--------------------------|-------------------------------------------------------|---------------------------------------|--------------|
| Checklists | Generic step-by-step before/during/after, not host-specific | n/a | n/a | UPT-specific, personalised, dated, source-cited |
| Learning Agreement | OLA: Table A/B/C, 3-party signature, no course suggestions | n/a | n/a | Suggestions + draft for paste into OLA; no signing |
| Course equivalence | Manual lookup in PDF catalogue | n/a | Embeddings/classifiers + human review; pure cosine not decisive | Embedding recall + LLM reasoning + coordinator disclaimer |
| Conflict detection | n/a | Block or flag overlapping courses | n/a | Flag with parity-awareness |
| Calendar export | n/a | .ics download | n/a | .ics with parity RRULE |
| Cross-faculty timetable | n/a | Single-institution registrar data feeds | n/a | Normalise from 10 faculty sources (seeded + AI extractor) |
| Room directions | n/a | Usually building codes only | n/a | Code decoder using UPT's own room legend |

---

## Data Sources

All fetched 2026-11-20 from this machine unless noted. "Confidence" = confidence the URL is correct, stable enough for the demo, and that the described structure is accurate.

### 1. Erasmus Course Catalogue (incoming students)

**Landing page (HTML, WordPress, English):** `https://international.upt.ro/en/incoming-students/course-catalogue/` - HTTP 200. Confidence HIGH.
This page does **not** contain the courses. It lists four entries, one per year, each a "View details" link:

| Year | URL | Fetchable? | Format / notes |
|------|-----|------------|----------------|
| 2026-27 | `https://uptro29158-my.sharepoint.com/:f:/g/personal/irena_ciobanu_upt_ro/IgC-J1bWIx5sRKmr1SUThuUUARdD6REztGYwJC7n4FX7Cpg?e=n1ASPK` | **NO.** curl returned 403 / a Microsoft sign-in page; WebFetch got 403 | SharePoint folder. Folder name seen in a redirect: `Noul site/Erasmus+/2025-2026/Course catalogue`. File type inside unknown. |
| 2025-26 | `https://uptro29158-my.sharepoint.com/:f:/g/personal/adriana_iacob_upt_ro/IgDDDR9pCv04T6ZqGciYjgJ2AW0qFSK8NN8J4kh7SCRGF0s` | **NO** (same) | same |
| 2024-25 | `https://uptro29158-my.sharepoint.com/:f:/g/personal/irena_ciobanu_upt_ro/EgAUTW-gpENIg1K7ysf38owBA5SbUOKDvHLB9LlRHojC8g?e=4Gqflg` | **NO** (same) | same |
| 2021-24 (archive) | `https://international.upt.ro/en/incoming-students/course-catalogue-2021-2024/` | **YES**, HTTP 200 | 23 direct .xls links (below). Every file is labelled **2021-2022**. |

**ACTION FOR THE USER (blocks nothing, but do it first):** open the three SharePoint links in a normal browser. They are probably "anyone with the link" shares that work with a browser session but not with curl. If they open, download the 2026-27 folder's files into `data/raw/catalogue/`. If they ask for sign-in, use the 2021-22 files below as the demo catalogue and say so ("catalogue snapshot 2021-22; swap in 2026-27 when published").

**Machine-readable, public, verified: 23 .xls files under `https://international.upt.ro/wp-content/uploads/2024/02/`** (each HTTP 200, downloaded and parsed with SheetJS):

| Faculty (code) | Files |
|----------------|-------|
| Automation & Computing (AC) | `Course-Catalogue_AC_2021-2022_Bachelor_site.xls`, `..._Master_site.xls` |
| Architecture (ARH) | `Course-Catalogue_ARH_2021-2022_Bachelor_site1.xls`, `..._Master-studies_site1.xls` |
| Industrial Chemistry & Env. Eng. (CCIM) | `Course-Catalogue_CCIM_2021-2022_Bachelor_site.xls`, `..._Master_site1.xls` |
| Civil Engineering (CT) | `Course-Catalogue_CT_2021-2022_Bachelor_site.xls`, `..._Master_site.xls` |
| Electrical & Power (EE) | `Course-Catalogue_EE_2021-2022_Bachelor_site.xls` (Master is on the old host: `http://www.upt.ro/img/file/Erasmus+/2122/Course%20Catalogue_EE_2021-2022_Master_site.xls`, HTTP 200) |
| Electronics, Telecom & IT (ETcTI) | `Course-Catalogue_ETcTI_2021-2022_Bachelor_site1-1.xls`, `..._Master_site3.xls`, `Course-catalogue_ETcTI_2021-2022_Distance-learning_site.xls` |
| Engineering Hunedoara (IH) | `Course-Catalogue_IH_2021-2022_Bachelor_site.xls`, `..._Master_site.xls` |
| Management in Production & Transport (MAN/MPT) | `Course-catalogue_MAN_2021-2022_site_Bachelor-studies.xls`, `..._Master-studies.xls` |
| Mechanical Engineering (MEC) | `Course-Catalogue_MEC_2021-2022-Bachelor_site1.xls`, `..._Master_site.xls`, `..._Distance-Learning_site1.xls` |
| Communication Sciences (SC) | `Course-Catalogue_SC_2021-2022_Bachelor_site.xls`, `..._Master_site.xls`, `..._Distance-Learning_site1.xls` |

**Structure, measured (first-hand):**
- Legacy Excel 97 `.xls`; one data sheet per file (sometimes a leading sheet named `Lista` that holds dropdown values: skip it). Sheet names vary (`Bachelor_2021-2022`, `Master 2021-2022`, `Sheet1`).
- **About 2,700 course rows total** across the 23 files (about 2,600 are flagged "recommended for international students"). By source language, about 467 rows are taught in English and about 758 have English teaching materials. AC (about 349 rows over Bachelor+Master), CT (about 436) and ETcTI are the richest English-language sources. IH, MEC-Master, EE-Master have almost nothing taught in English.
- Columns (13 to 18 depending on file; header text is always `English - Romanian` in one cell):
  `Name of the study programme` | (`Field of study` in some files) | `Programme general description` | `Course unit` | `Code - Codul GISC` (only in AC, CCIM, EE, MEC and some others) | `Year of study` | `Semester` | `ECTS credits` | (`Course/Seminar/Laboratory/Project hours` in about 4 files) | `Language the course units are taught` | `Learning, teaching and assessment procedures` (this is the delivery mode: face-to-face / online, **not** the exam type) | `Existence of teaching materials in English: YES/NO` | `Possibility of individual study in English` | `Course unit recommended for international students: YES / NO / YES if...` | `10 keywords describing the course unit` (bilingual, EN then RO).
- **Parsing hazards:** programme name and description are **merged cells** (only on the first row of each programme; forward-fill). Cells are bilingual strings (`Physics - Fizică`: split on ` - `, but some course names contain hyphens). Language values look like `ENGLISH - ENGLEZĂ`. The column that holds "the language" shifts by file, so detect columns by header regex, not by index. Numbers sometimes stored as text.
- **There is NO faculty column** (derive from the file name) and **NO evaluation type** (E/C/V). For evaluation type and a second ECTS check, join to the study plans (below).
- Confidence: HIGH for the 2021-22 structure; the 2025-26/26-27 files' structure is **unknown** until the SharePoint folders are opened.

**Study plans (for evaluation type, hours, codes).** PDF, Romanian, text layer extractable. Example fetched (HTTP 200, 540 KB): `https://www.upt.ro/img/files/2025-2026/PlanInvatamant/2025-2029_AC_Licenta_TI.pdf`. Layout: all 8 semesters side by side; per course a code (`L003.25.01.F1`), credits, evaluation form (`E` exam / `V` verification / `C` colloquium), and C/S/L/P hours. Parseable with the LLM or a regex, but slow to normalise for all programmes. Other plans appear in the search index under the same path (`/img/files/2025-2026/PlanInvatamant/...`, `/img/files/2023-2024/PI/Etcti/licenta/...`); not individually fetched. Confidence MEDIUM. **Recommendation:** skip for Sunday; use "evaluation type: see study plan" as a plain link.

### 2. Course catalogue page pointers / host-faculty coordinators

`https://international.upt.ro/en/incoming-students/erasmus-studies/studies-2026-2027/` - HTTP 200, HTML. Lists, per faculty, the **Learning Agreement coordinator name + email** (Architecture: C. Bocan; AC: C.-B. Chirilă; Civil: S. Herban; SC: S. Șimon; Doctoral: D. Lelea; Electrical: A. Simo; ETcTI: M. Mocofan; Hunedoara: S.-A. Rațiu; Chemistry: A.-M. Pană; MPT: I. Tăucean; Mechanical: C. Vigaru; Robotics/AI/Autonomous Systems: O.-S. Chirilă). Use this for the LA "who approves" block. Confidence HIGH.

### 3. Faculty timetable portals

Central index (English): `https://www.upt.ro/en/students/calendar-timetables` - HTTP 200. It lists every faculty portal, the campus map and the academic-year structure (all hrefs verified in the page). **Start from this page; it is the single best discovery URL.** Semester-1 2026-27 timetables are posted on most portals as of today.

| Faculty | Portal URL (HTTP 200) | Format of timetable | Notes |
|---------|-----------------------|---------------------|-------|
| AC | `https://ac.upt.ro/orare/` (EN: `/en/orare/`) | **Current (2026-27 sem 1): SharePoint Excel links, not fetchable.** Past semesters: **published Google Sheets** (`docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml`). Also .xls/.xlsx **consultation-hour** files. | Google Sheets are fetchable as CSV: append `/pub?output=csv` (first tab) or `/pub?gid=<gid>&single=true&output=csv`. Example verified: `https://docs.google.com/spreadsheets/d/e/2PACX-1vSoZy5J8L8WcL2SSdS1LtyENXrbasE-vyXbx0_VVcptn1lPNaFxTHnPEH2Ba9iUidEkBs6yRK9t8E1Q/pubhtml` (CTI + CTI-English, sem 2, 2024-25; tabs An I..IV, An 1-4 Engleza, An I CCIT/IT/ML/QT/SE, **Legenda sali**). **Best demo source for the grid: structured, English-programme tabs exist.** |
| ETcTI | `https://etc.upt.ro/avizier/orar` -> `/orar-semestrul-1` | PDF (1 page per programme). The 2026-27 files are titled **"Orarul Consultațiilor"** (teacher consultation hours per course: room + day), e.g. `https://etc.upt.ro/attachments/article/2022/LICENTA_Orar_consult_SEM%20I_ETC_TST_Eng_Anii_I-IV_2026_2027.pdf` (HTTP 200) | I did **not** find a student group class timetable on this page. Odd-looking diacritics in the PDF text layer (encoding). Useful for English programme TST-Eng: shows which room each course meets in. Treat as MEDIUM; confirm with the user whether ETcTI's group timetable is elsewhere. |
| MEC | `https://mec.upt.ro/orare-2/` | PDF per year/series, text layer extractable. Example: `https://mec.upt.ro/wp-content/uploads/2026/10/I_B_Sem_1_2026-2027_v_7.pdf` (HTTP 200). Includes English series C: `.../2026/09/Orar_I_Mechanical-Engineering_sem-I-2026-2027.pdf` | Big landscape grid: rows = day x 2h slots (08_10 ... 18_20), columns = **GRUPA 6/7/8 -> semigrupa 1/2**. Cell text: `Fizica (L)`, `Analiza (S) Gaina A. Sala N 212`, `... - curs (sala N 301)`. **Cells contain no consistent parity marker.** Hard for regex: use vision/LLM. Versions in the filename (`_v_7`) change. |
| CT | `https://www.ct.upt.ro/studenti/orare/index.htm` | PDF per year/specialisation (`files/licenta/1. ANI ING CIVILA ORARE SEM 1 2026-2027.pdf?v=...`) plus **room-allocation PDFs** (`files/grafic/1. AMFITEATRE GRAFICUL SALILOR SEM 1 2026-2027.pdf`) | Group codes 111-117 with `a`/`b` halves, Serie 1/2. Room codes A107, C204, NM, H3. Diacritics lost in the text layer. Room PDFs show **by room, which course uses it**, useful for a "where am I" lookup. |
| MPT | `https://mpt.upt.ro/orare/` | **XLSX**, one sheet per year (`IM an I` ...). Current: `https://mpt.upt.ro/wp-content/uploads/2026/11/MPT-Orar-2026-2027-sem.1-2026.11.09-v07.xlsx` (HTTP 200) | Easiest format to parse. Cell text like `Fizica (Fiz), curs, A0, A.Palcu, 3 h sapt.1-4, 2 h sapt. 5-12`. Has a legend: `p - saptamana para; i - saptamana impara; Lab. Fizica este in sala C301B, cladirea ET, corpul C`. |
| SC | `https://sc.upt.ro/ro/studenti/orare` | **XLSX** per programme, e.g. `https://sc.upt.ro/attachments/article/39/ORAR_CRP_I,II,III_sem.1_2026-2027_02.10.2026.xlsx` (HTTP 200) | Parity written as `Săpt.imp.` / `Săpt. par` / `Sapt. para`, groups as `Gr. F`, `Gr. G`. Rooms `A210`, `Ca3`. |
| IEE (Electrical) | `https://iee.upt.ro/web/ro/avizier/orare` | PDF (26 files), `.../web/sites/default/files/orar/orar%201%20Ing%20Energetica%2026-27%20sem1_1.pdf` | Not parsed. |
| ARH | `https://arh.upt.ro/orar-calendare/` | **Nextcloud links** (`nextcloud.upt.ro/index.php/s/...`) for timetable, room mirror ("Oglinda sălilor") and consultation hours | Not fetched (share links, format unknown). |
| CCIM (Chemistry) | `https://chim.upt.ro/categorie/studenti/orare/` -> `/orar-an-universitar-2026-2027-semestrul-i/` | HTML pages with embedded links | Not opened. |
| FIH (Hunedoara) | `https://fih.upt.ro/orar/` | HTML page with semester selector and links by programme (L1 IIDI, L1 IMAN ...) | Not opened. Hunedoara is a different city; Erasmus courses at Timisoara rarely involve it. |
| Physical education | `https://efs.upt.ro/orar.html` | **HTML table**, easily scrapable: day, Baza 1/2, place, sport, instructor, hour slot | Useful for the "sports" utility card. |

**How odd/even weeks, groups and rooms are actually written (measured on the files above):**
- **Parity is free text, not a column, and differs per faculty.** Seen: `sapt. impara` / `sapt. para` (AC), `Săpt.imp.` / `Săpt. par` / `Sapt. para` (SC), `i - saptamana impara; p - saptamana para` as a legend (MPT), explicit ranges `sapt 1-10`, `(sapt. 1, 2, 3, 4)`, `3 h sapt.1-4, 2 h sapt. 5-12` (AC, MPT). Typos and diacritics vary. MEC and CT sample files have no visible parity markers at all (they may use separate cells or colours). **Implication:** a regex gets about 80%; use Claude to normalise to `{parity: odd|even|both, weeks: [..]}` and show it for confirmation.
- **Groups/subgroups:** AC `Seria 1 (C) / Seria 2 (D)` with columns `1.1 1.2 2.1 2.2 3.1 3.2`; MEC `GRUPA 6 -> semigrupa 1/2`; CT groups `111..117` with `a/b`; SC `Gr. F`, `Gr. G`; MPT `gr.1 .. gr.6`.
- **Activity type:** letter in brackets: `(c)` course, `(s)` seminar, `(l)` lab, `(p)` project (AC, MEC, SC).
- **Room codes:** letter prefix + digits. Official legend (from the AC Google Sheet tab `Legenda sali`, HTTP 200, `.../pub?gid=738522671&single=true&output=csv`):
  - `Axyz` = Electro complex, **A body** (where the AC dean's office is); `Bxyz` = **B body, the 7-storey block**; `Cxyz` = C body; `D1` = **D body**, the single-storey rear building.
  - `ASPC` / `ASPC-A325` = ASPC building (Atelier Școlar pentru Proiectare și Cercetare), Str. Ioan Curea 1 (ground-floor lecture room / third-floor seminar room).
  - `MEC-N205` / `Nxy..` = Mechanical Faculty **new** building (Bd. Mihai Viteazu 1), floor x. The legend says literally "Nx05 ... etajul x", which gives the rule **first digit after the letter = floor**. By analogy `B410` = body B, floor 4 (inference, MEDIUM; the legend states the floor rule only for N).
  - `Orol 114` = Orologerie building (Mechanics/Strength of Materials department). `SPM` = building opposite dorm 2MV. `303-Chimie Centru`, `A1, A2, B8` (Chemistry old building, Bd. V. Pârvan 6), `30xCP` (Chemistry new "Parc" building), `PN` (Hydrotechnics, over the Mihai Viteazu bridge).
  - Other prefixes seen but not in the legend: `M` (Mechanical, old wing), `H3` (CT), `Ca3` (SC), `S4` (AC), `Dep.MEO/BFI/Mate` (department rooms), `P14`.

### 4. Academic calendar / structure of the year

- `https://international.upt.ro/wp-content/uploads/2026/06/Academic_Year_2026-2027-IF_EN.pdf` - HTTP 200, English PDF, garbled text layer (letters interleave). Read visually before using. From the parsed text: semester 1 teaching starts 28 Sep 2026 (12 weeks, to 18 Dec), holiday 21 Dec-10 Jan, 2 more teaching weeks 11-22 Jan 2027, exams 25 Jan-21 Feb, semester 2 starts 1 Mar 2027. Confidence MEDIUM until checked by eye. Needed for .ics date generation.
- Romanian original: `https://media.upt.ro/HS nr. 26 din 19.03.2026_privind aprobarea Structurii anului universitar 2026-2027.pdf` (use `%20` in curl), 6 pages, HTTP 200. Linked from the central timetable page.

### 5. Official incoming-student / mobility guides

**The single most important source for Module 2:** `https://international.upt.ro/en/incoming-students/erasmus-studies/studies-2026-2027/` - HTTP 200, plain HTML, English, about 3.5k words, well structured by question headings. It contains every fact in PROJECT.md:
- Nomination by the home office to `incoming@upt.ro`, with required fields; deadlines KA131 18 Jun / 10 Dec, KA171 30 Jun / 30 Nov.
- Documents: application form, ID copy, passport copy (non-EU only), Learning Agreement; **single PDF named `SURNAME Name_University of origin`** emailed to incoming@upt.ro. KA171 adds transcript, OLS result, bank statement (EUR or multicurrency, with IBAN and SWIFT), insurance (health, accident and civil liability).
- Acceptance letter within 5 weeks of the deadline; visa check at `https://eviza.mae.ro/home`; financial contract issued once all documents are in.
- Dorm: mainly **Residence 11C** (Aleea Studenților 11C), arrive Mon-Fri 08:00-16:00; out-of-hours arrival needs one week's notice and the key/temporary card is picked up at **Residence 8C**; **450 RON/month paid monthly by card only**; **600 RON cash deposit**, refundable; 2 students/room; ID copy + **two 3x4 cm photos** for the contract; no private-housing help from the office.
- Registration: **Rectorate, Piața Victoriei 2, 1st floor, office 107**, Mon-Thu 12:00-15:30, Fri 11:00-13:00; bring ID/passport (+ visa for non-EU), health and civil-liability insurance, home-uni documents to sign.
- Enrolment, internet credentials, national student card (from the faculty, 2 photos), UPT student card (from the library, for dorms, sports, library), orientation week, **LA changes within the first 30 days**, **attendance: at least 66% of lectures, 100% of labs/seminars/projects**, departure certificate, KA171 extras (ECAS survey, narrative report, 5 photos).
- Downloads linked on the page: application form `https://international.upt.ro/wp-content/uploads/2024/10/Application_inbound_mobilities_and_GDPR.doc`; KA171 forms on box.com (`https://app.box.com/s/mi4fhxpimhwwchhofr4z34j7yq6enkp7`, GDPR `.../zsg1iw6ic9jqad9yms3qb5a7gma08s7c`, LA `.../c0u6gzlrswu54uglwy9vrf6vwz4djz0q`); ECTS and grading `http://www.upt.ro/img/file/Erasmus+/Studenti%20Incoming%20/ECTS%20AND%20GRADING%20SYSTEM%20at%20UPT_2017.pdf`; Erasmus Student Charter; Rights of international students `http://www.upt.ro/img/file/Up/Rights_en.pdf`; Fact sheets 2026-27 on SharePoint (not fetchable).
- Contacts on the page: `incoming@upt.ro` (Irena Ciobanu for KA131, Diana Balș-Diaconescu for KA171); tel +40 256 403 134 (from the incoming landing page); Rectorate pin 45.75363, 21.22516.
- Confidence: HIGH. Last-year equivalent `.../studies-2025-2026/` is nearly identical but **omits the 450 RON/month figure**; use 2026-27.

Related pages (all HTTP 200):
- `https://international.upt.ro/en/incoming-students/erasmus-traineeship/traineeship-2026-2027/` - traineeship variant. The page text I parsed repeats the application form links and fact sheets; details of the traineeship flow not fully read. MEDIUM.
- `https://international.upt.ro/en/incoming-students/` (landing, contact), `.../romanian-language-course/`, `.../non-erasmus/`.
- `https://international.upt.ro/en/more/guidelines-and-procedures/` - institutional strategy and procedures (staff mobility, IT rights decision). Low value for students.
- `https://international.upt.ro/en/more/contact-eng/` - contact page, HTTP 200 (not parsed).
- **Do NOT use** for Erasmus students: the non-EU **degree** pages (`.../students-from-countries-outside-the-eu-eea-or-the-swiss-confederation/2026-2027/visa|accommodation|guide/`). They describe D/SD long-stay study visas (about 120 EUR, tuition paid, means of support, TOEFL) and **550 RON/month** for degree students, dorm 8C and `student-admissions@upt.ro`. This differs from the Erasmus KA171 route (visa via eviza.mae.ro after the acceptance letter, 450 RON/month, `incoming@upt.ro`). The PDF "Guide for international students 2026-27" is a SharePoint link (not fetchable) and also targets degree students.
- Older arrival/info guides (outdated, only as sanity checks): `https://www.upt.ro/img/file/Erasmus+/Studenti%20Incoming%20/INFO_GUIDE_2015-2016.pdf` (found by search, not fetched), `https://www.upt.ro/img/file/Proceduri/Regulament%20Erasmus_stud_IN.pdf` (found by search, not fetched; likely the incoming-student regulation, worth a look for the grading/attendance rules).
- Student guides with dorm, canteen and polyclinic text (Romanian): `https://www.upt.ro/img/files/studenti/Ghidul_Bobocului_2023.pdf` (HTTP 200, 16 MB, text layer with lost diacritics, 2023 edition). `https://ac.upt.ro/wp-content/uploads/2025/07/Info-utile-2025.pdf` (HTTP 200).

### 6. Campus map and room-code documents

- `https://media.upt.ro/Harta%20Campusului%20UPT.pdf` - HTTP 200, **single-page vector PDF** (850 KB), Romanian labels, linked from the central timetable page as "UPT Campus Map". Text layer has building labels (Fac. AC/ETc, Fac. MPT, SPM, 1MV/2MV, dorms 1C..25G, Biblioteca UPT, Baza Sportivă nr. 1/2, Orologerie, ASPC, Fac. ICBPM, CCTFC). Garbled when extracted but fine as an image. Use it as a link/embedded image, **not** as a data source. Confidence HIGH that it is the official map.
- `https://visit360.upt.ro/` - 360 degree campus tour, linked from the same page. Not fetched.
- **No standalone document explaining room-code conventions was found.** The only official convention text is the AC Google Sheet legend (Data Sources #3, quoted above). Confidence: HIGH that the legend exists, MEDIUM that the B410 floor rule generalises.

### 7. Campus utilities

| Utility | Source (all HTTP 200) | What it gives | Gaps |
|---------|-----------------------|---------------|------|
| Sports | `https://www.upt.ro/en/students/sport-wellbeing` (English) | Sports Complex 1 (gym, jogging, athletics track, free for students), Complex 2 at Str. Prof. Dr. Aurel Păunescu Podeanu 2 (outdoor pool, indoor hall, grass pitches, tennis; some need a request at the Rectorate registry). Regulation PDFs are Romanian only. | Opening hours only in Romanian PDFs. Class schedule: `https://efs.upt.ro/orar.html`. |
| Polyclinic | same page | **UPT Student Polyclinic, Aleea Studenților 1**, part of the Pius Brînzeu hospital outpatient clinic; free **if insured as a student**; need ID + health insurance card (+ referral for specialists); phone +40 771 500 926, Mon-Fri 10:00-14:00 | Erasmus students' insurance status (EHIC / private) is not addressed on the page. Do not promise free care. |
| Psychological counselling | same page | CCOC counselling is free and confidential | Booking link only. |
| Library and card | `https://library.upt.ro/` (JS-rendered), `https://library.upt.ro/inscriere-si-eliberare-legitimatie/`, `https://library.upt.ro/orar/` | Card enrolment and issue page, opening hours page, `bupt@upt.ro` | The pages render mostly via JS; the card requirements could not be read by curl. The incoming page says the **UPT student card is issued by the library at registration**, and that is what the dorm, sports and library use. |
| Canteen | `https://www.upt.ro/img/files/studenti/Ghidul_Bobocului_2023.pdf` (p.16) | Student canteen, self-service on the ground floor; open **12:00-18:00 (no breakfast)**; meal cards give a reduced price. 2023 data. | No current official page found for hours or prices; verify before the demo. Say "as of the 2023 guide". |
| Dorms (general) | `https://www.upt.ro/en/students/accommodation` | Social Support Office contacts (`maria.palfalvi@upt.ro`); mostly for degree students | Not relevant for Erasmus beyond the 11C/8C facts above. |

### 8. Third-party / background (not UPT)

- Erasmus+ App (checklists, OLA and OLS integration): `https://erasmusapp.eu/index.html` (linked from the UPT page). The App already provides generic checklists, so a UPT-specific, dated and source-cited list is the differentiator.
- ESN Timisoara: referenced on the UPT page; no site fetched (`esntimisoara.ro` did not respond).

### Verification status summary

| Item | Status |
|------|--------|
| 2021-22 catalogue (23 xls) | Fetched and parsed. HIGH. |
| 2024-27 catalogue | Located, **not fetchable** (SharePoint sign-in). Needs a manual download. |
| Erasmus studies 2026-27 page | Fetched and read in full. HIGH. |
| AC timetable (past semesters) | Fetched as CSV. HIGH. |
| AC timetable (2026-27 sem 1) | Located (SharePoint), **not fetchable**. |
| MEC / CT / ETcTI PDFs, MPT / SC XLSX | Fetched and text-extracted. HIGH for format; MEC/CT parity not found. |
| ARH, CCIM, FIH, IEE content | Index pages fetched; files not opened. |
| Campus map PDF | Fetched; visual check not possible here (no PDF renderer). MEDIUM on label detail. |
| Cantina, library-card rules | Partial; flagged above. |

---

## Sources

- UPT International Relations site (international.upt.ro): course catalogue pages, incoming studies/traineeship pages, non-EU degree pages (HIGH, fetched)
- UPT main site: `https://www.upt.ro/en/students/calendar-timetables`, `/sport-wellbeing`, `/accommodation` (HIGH, fetched)
- Faculty portals listed in Data Sources #3 (HIGH where fetched)
- Erasmus+ App and OLA descriptions: university pages found by web search (MEDIUM, secondary): `https://ict.uoc.gr/intrel/images/Erasmus__app_presentation.pdf`, `https://www.mgt.tum.de/fileadmin/mgt.tum.de/downloads/international_exchange_programs/Going_abroad/Manual_Online_Learning_Agreement_OLA_Outgoing_UPLOAD.pdf`
- AI course-equivalence research (MEDIUM, preprints, self-reported accuracy): `https://ceur-ws.org/Vol-4213/paper35.pdf`, `https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.poster-demo-papers.282/index.html`, `https://arxiv.org/abs/2601.05666`
- Schedule-builder analogues (MEDIUM): `https://atlas.ai.umich.edu/whats-new/note/schedule-builder-calendar-export-available/`, `https://classes.cornell.edu/content/FA14/using-scheduler`, `https://live-ucalgary.ucalgary.ca/registrar/registration/schedule-builder`

---
*Feature research for: UPT incoming Erasmus+ assistant (course matcher, paperwork, cross-year schedule)*
*Researched: 2026-11-20*
