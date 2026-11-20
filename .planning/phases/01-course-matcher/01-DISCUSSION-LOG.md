# Phase 1: Course Matcher - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-21
**Phase:** 1-Course Matcher
**Areas discussed:** Match scope & ranking, Home course entry, Learning Agreement draft, Catalogue gaps & contacts

---

## Match scope & ranking

| Question | Options | Selected |
|----------|---------|----------|
| English-only default applies to matching? | Both / Catalogue only / Matching ignores it | Both (later superseded: filter dropped) |
| Semester / year limit | Optional semester filter / Required semester / No filtering | Optional semester filter |
| Matches per course | Top 3 + show more to 5 / Top 5 / Top 3 only | Top 3 + show more to 5 |
| Score bands | Strong/Partial/Weak / Percent + band / You decide | Strong/Partial/Weak |

## Home course entry

| Question | Options | Selected |
|----------|---------|----------|
| Required fields | Name only / Name + description / All four | Name only |
| When matching runs | Per course on add / Match all button / Both | Per course on add |
| Persistence | Courses + last matches / Courses only / Nothing | Courses + last matches |
| Sign-in | Sign-in first / Try first / Public catalogue | Sign-in first |

## Learning Agreement draft

| Question | Options | Selected |
|----------|---------|----------|
| Linking to home course | Linked but optional / Always linked / No linking | Linked but optional |
| ECTS target | 30 per semester meters / Ask mobility length / No target | 30 per semester meters |
| Extra CSV columns (multi) | Programme + year / Language / Home ECTS / Source row | Home course ECTS, Programme + study year |
| Printable header | Name + home uni + date / Table only / You decide | Name + home uni + date |

## Catalogue gaps & contacts

| Question | Options | Selected |
|----------|---------|----------|
| AC Master English? | Yes all / Only English-named / File column | Yes all (later moot) |
| Missing faculties | Note in catalogue / 2021-22 data / Silently omit | Note in catalogue |
| Coordinator contacts | Hand-curated from contact page / Generic office / From files | Hand-curated |
| Blank-language rows | Unknown hidden / Romanian / English | Free text: "If the course is in the catalogue, it implies an Erasmus (English) alternative." |

**Follow-up:** User asked for a document showing the rows labelled Romanian/French/German. Claude produced `catalogue-language-check.xlsx` (summary + 1,164 non-English/blank rows with Excel row numbers). User confirmed: all catalogue courses count as English for Erasmus students, whatever the language column says.

| Question | Options | Selected |
|----------|---------|----------|
| Replacement for "English-taught only" (MATCH-06) | Drop filter, show listed language as info / Drop and hide language / Plain language filter | Drop filter, show listed language as info |

## Claude's Discretion

- Score-band thresholds; hint/empty-state wording; where home university is first asked.

## Deferred Ideas

- Import missing faculties when their files are found.
