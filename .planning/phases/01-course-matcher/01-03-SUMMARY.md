---
phase: 01-course-matcher
plan: 03
subsystem: matching
tags: [gemini, embeddings, pgvector, drizzle, nextjs, zod, name-similarity]

requires:
  - phase: 01-02
    provides: "204 AC courses seeded (course + faculty with the AC coordinator), listCourses, FacultyDot, withServer smoke harness"
provides:
  - "Name mode (D-19): deterministic name similarity over the AC catalogue (src/domain/normalise.ts, src/domain/name-match.ts), template reasons, evidence 'Compared by catalogue entry'"
  - "Topic mode (D-20): 5-8 inferred topics per AC course (data/seed/course-topics.json, topicsSource 'inferred'), name+topics embeddings (gemini-embedding-2, 768 dims) in course.embedding, pgvector cosine search with exact semester-parity filter"
  - "src/llm/gemini.ts: the only Gemini client (embed, generateJson), one retry on 429/503, GeminiUnavailableError"
  - "GET/POST /api/home-courses, POST /api/matches (400/404/502), facts + coordinator joined from the DB"
  - "MatchCard + minimal Matcher page (name, ECTS, description; top 3, Show more up to 5)"
  - "npm scripts topics:enrich, embed:courses, smoke:match, golden [-- --topics] [-- --limit N]"
  - "Golden set: 12 positive + 2 negative AC cases (data/golden/golden-set.json)"
affects: [01-04, 01-05, 01-06]

actuals:
  tokens: 9500
  tasks: 2
  commits: 3

tech-stack:
  added: [] # @google/genai 3.6.1 was added before this plan (7e7e320)
  patterns:
    - "Two rankers behind one contract: matchByName / matchByTopics -> RankedMatch[] -> enrichMatches(ranked, mode) -> MatchView[]; facts never come from the ranker"
    - "Offline AI enrichment -> committed seed JSON -> idempotent seed; embeddings written by a separate offline script (embedding IS NULL = todo)"
    - "Semester filter is SQL parity (semester % 2), never part of embedded text"

key-files:
  created:
    - src/domain/normalise.ts
    - src/domain/name-match.ts
    - src/domain/bands.ts
    - src/domain/matches.ts
    - src/domain/semester.ts
    - src/domain/domain.test.ts
    - src/llm/gemini.ts
    - src/services/matcher.ts
    - src/app/api/home-courses/route.ts
    - src/app/api/matches/route.ts
    - src/components/match-card.tsx
    - src/app/(app)/matcher/matcher-view.tsx
    - scripts/enrich-topics.ts
    - scripts/embed-courses.ts
    - scripts/smoke-match.ts
    - scripts/golden.ts
    - data/seed/course-topics.json
    - data/golden/golden-set.json
  modified:
    - src/app/(app)/matcher/page.tsx
    - scripts/seed.ts
    - src/app/globals.css
    - package.json

key-decisions:
  - "Name score = 0.7 x word-token Dice + 0.3 x character-trigram Dice of the normalised names (0..100), scored per '/' half of bilingual names (best half wins), plus 5 per extra description word found in the course name, capped at +10"
  - "Bands (D-06): score >= 70 Strong, 40-69 Partial, < 40 Weak, after clamp 0..100 + Math.round; same thresholds for both modes"
  - "Topic score = linear map of cosine similarity: 0.62 -> 0, 0.88 -> 100 (SIM_FLOOR/SIM_CEIL in bands.ts). Calibrated on the golden run: expected matches sat at cosine 0.81-0.88, related neighbours 0.72-0.82, the best unrelated course 0.68-0.69; so Strong starts near cosine 0.80, Partial near 0.72, and unrelated courses stay Weak"
  - "Golden pass thresholds: name mode >= 10/12, topic mode >= 9/12 (plan gate), negatives must have no Strong"
  - "Matcher picks topic mode when the home course has topics (from an uploaded syllabus, 01-04), else name mode; nothing is cached (D-19), so /api/matches `force` is accepted but has no effect"
  - "Evidence label comes from data: name mode -> 'Compared by catalogue entry'; topic mode -> 'Topics inferred from course name' (topicsSource inferred) or 'Compared with UPT syllabus' (topicsSource syllabus, 01-06)"

patterns-established:
  - "Golden gate as an npm script against the services directly (no server): prints top 3 per case and a final 'GOLDEN n/12 negative=PASS|FAIL' line, exit 1 below threshold"
  - "Ablation check for overfitting: blank the hand-written map, rerun the golden gate, compare"

requirements-completed: [MATCH-02, MATCH-03, MATCH-09, MATCH-11]

coverage:
  - id: D1
    description: "Pure domain: bands 70/40 boundaries, clamp/round/non-finite, cosine -> score monotonic, season/parity filter, normalisation (case, whitespace, diacritics, NFC/NFD), stopwords/plurals/abbreviations, scoreName (bilingual halves, elective prefixes, description bonus, stopword-only name = 0), finaliseMatches (dedupe, sort score desc then id asc, top 5, topic never both covered and missing), topicOverlap"
    requirement: MATCH-02
    verification:
      - kind: unit
        ref: "npx vitest run -> Test Files 2 passed, Tests 28 passed (16 in src/domain/domain.test.ts + 12 catalogue-parse)"
        status: pass
    human_judgment: false
  - id: D2
    description: "End to end both modes through the built app: 1-5 matches, facts equal the DB row, bands valid, evidence label per mode, coordinator email set, empty name 400, another user's homeCourseId 404"
    requirement: MATCH-03
    verification:
      - kind: e2e
        ref: "npm run build && npm run smoke:match -> SMOKE MATCH OK (name: top 3 L002.25.04.F4, M4.25.03.S1-02, L002.23.08.S2-04; topics: top 3 L002.25.04.F4, M4.25.03.S1-02, M1.26.02.S1-02, OS covers CPU scheduling; memory management; file systems)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Golden gate, name mode: 12/12 positives with an expected code in the top 3, both negatives Weak only"
    requirement: MATCH-02
    verification:
      - kind: integration
        ref: "npm run golden -> GOLDEN 12/12 negative=PASS (threshold 10)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Golden gate, topic mode: 12/12 positives, both negatives Weak only"
    requirement: MATCH-11
    verification:
      - kind: integration
        ref: "npm run golden -- --topics -> GOLDEN 12/12 negative=PASS (threshold 9)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reason quality, Weak-card greying, and the plan's Matcher human-check"
    requirement: MATCH-02
    verification: []
    human_judgment: true
    rationale: "Wording honesty and visual weight of Weak cards are judgment calls; not yet looked at in a browser"

duration: not recorded (two sessions)
completed: 2026-11-21
status: complete
---

# Phase 1 Plan 03: Course Matcher (name and topic modes) Summary

**A student types a home course and gets up to five ranked AC matches with band, template reason, and facts plus coordinator read from the database; name mode is pure code (D-19), topic mode embeds topics with Gemini and searches pgvector (D-20); both modes pass the AC golden set 12/12 with both negative cases Weak.**

## Performance

- **Duration:** not recorded; two sessions (implementation, then this verification and summary)
- **Completed:** 2026-11-21
- **Tasks:** 2 of 2
- **Files created/modified:** 22

## Accomplishments

- **Name mode (D-19).** `normaliseText` (NFKD, strip marks, lowercase, punctuation to spaces), `nameTokens` (synonym expansion, stopwords, bare numbers dropped, plural "s" stripped), `scoreName` (0.7 word Dice + 0.3 trigram Dice per "/" half, +5 per extra description word in the course name, max +10). Reason template: `Shares: <words> · <Season> (sem N) · <home> vs <UPT> ECTS` (ECTS part only when the student gave ECTS).
- **Topic mode (D-20).** `npm run topics:enrich` asked GEMINI_MODEL for topics per course from the course name and programme (batches of 25) -> `data/seed/course-topics.json` (204 courses, 5-8 topics, avg 6.5, all `inferred`); `npm run db:seed` applies them without touching syllabus topics. `npm run embed:courses` embeds `name + "Topics: ..."` only (no programme, semester, ECTS, level, language) as RETRIEVAL_DOCUMENT, 768 dims, 50 per chunk with a 35 s pause. DB now: 204 courses, 204 embeddings, 204 with topics, 204 `inferred`. `matchByTopics` embeds the joined home topics (RETRIEVAL_QUERY) and orders by `embedding <=> q` with the parity filter in SQL; reason `Both cover: ... · Not at UPT: ...` from word overlap.
- **API.** `POST /api/home-courses` (zod: name trimmed 1-200, description <= 8000, <= 30 topics of <= 200, ECTS 0.5-60 step 0.5, year 1-6) -> 201; `GET` own rows. `POST /api/matches { homeCourseId, force? }` -> 200 `{ homeCourseId, filter, mode, matches }`, 400 bad body, 404 other user's / unknown id, 502 `model_unavailable` when Gemini fails in topic mode.
- **UI.** Matcher page form (name required, ECTS, description) -> MatchCard list (top 3, "Show more" to 5), evidence chip from `evidenceLabel`, fact chips from the DB row, covered/not-covered chips only when present, coordinator notice; `.band-Weak` cards get the ground background and a muted name.

## Task Commits

1. **Task 1: name and topic matching end to end** - `12c686c` (feat)
2. **Task 2: AC golden set gate for both modes** - `602a9ee` (feat)
3. Handoff note while paused - `ea032bc` (docs; the handoff file is removed in the summary commit)

## Verification (re-run 2026-11-21 for this summary)

| Check | Result |
|---|---|
| `npx vitest run` | Test Files 2 passed (2), Tests 28 passed (28) |
| `npx tsc --noEmit` | exit 0, no output |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; routes `/`, `/api/home-courses`, `/api/matches`, `/catalogue`, `/matcher` |
| `npm run smoke:match` | `SMOKE MATCH OK` |
| `npm run smoke:catalogue` | `SMOKE CATALOGUE OK` |
| `npm run smoke:auth` | `SMOKE AUTH OK` |
| `npm run golden` | `GOLDEN 12/12 negative=PASS` (threshold 10) |
| `npm run golden -- --topics` | `GOLDEN 12/12 negative=PASS` (threshold 9) |
| DB | `course` 204, with embedding 204, with topics 204, topics_source inferred 204 |

### Golden printout, name mode (`npm run golden`)

```
Data Structures and Algorithms  [PASS]  expect L002.25.03.F2
  L002.25.03.F2 | Data Structures and Algorithms / Structuri de date și algoritmi | Strong | 100 | Shares: data, structure, algorithm · Winter (sem 3)
  M1.25.03.S1-01 | Elective 7.-9. / Opțional 7.-9. Parallel Algorithms / Algoritmi Paraleli | Partial | 41 | Shares: algorithm · Winter (sem 3)
  L002.25.04.F1 | Algorithm Design and Analysis / Proiectarea și analiza algoritmilor | Weak | 39 | Shares: algorithm, analysis · Summer (sem 4)

Operating Systems  [PASS]  expect L002.25.04.F4
  L002.25.04.F4 | Operating Systems / Sisteme de operare | Strong | 100 | Shares: operating, system · Summer (sem 4)
  M4.25.03.S1-02 | Elective 7.-9. / Opțional 7.-9. Operating Systems for IoT / Sisteme de Operare pentru IoT | Strong | 83 | Shares: operating, system · Winter (sem 3)
  L002.23.08.S2-04 | Elective 12.-15. Expert Systems / Opțional 12.-15. Sisteme expert | Partial | 49 | Shares: system · Summer (sem 8)

Databases  [PASS]  expect L002.25.03.F1 or L002.23.07.S2-08 or L001.23.07.S2-08
  L002.25.03.F1 | Databases / Baze de date | Partial | 68 | Shares: database · Winter (sem 3)
  L002.23.07.S2-08 | Elective 8.-11. Database Design / Opțional 8.-11. Proiectarea bazelor de date | Partial | 51 | Shares: database · Winter (sem 7)
  L001.23.07.S2-08 | Database Design / Proiectarea bazelor de date | Partial | 51 | Shares: database · Winter (sem 7)

Computer Networks  [PASS]  expect L002.25.04.F3
  L002.25.04.F3 | Computer Networks / Rețele de calculatoare | Strong | 100 | Shares: computer, network · Summer (sem 4)
  L002.24.06.S3-07 | Elective 4.-6. Computer Security / Opțional 4.-6. Securitatea sistemelor de calcul | Partial | 55 | Shares: computer, security · Summer (sem 6)
  L002.25.04.F5 | Digital Computers / Calculatoare numerice | Partial | 50 | Shares: computer · Summer (sem 4)

Object-Oriented Programming  [PASS]  expect L002.25.03.F3
  L002.25.03.F3 | Object-Oriented Programming / Programarea orientată pe obiecte | Strong | 100 | Shares: object, oriented, programming · Winter (sem 3)
  L002.24.06.S3-03 | Elective 4.-6. Distributed Programming / Opțional 4.-6. Programarea sistemelor distribuite | Partial | 45 | Shares: programming · Summer (sem 6)
  M6.26.01.S1-03 | Elective 1.-3. / Opțional 1.-3. Web Programming / Programare Web | Partial | 44 | Shares: programming · Winter (sem 1)

Fundamentals of Machine Learning  [PASS]  expect M3.26.01.S1-01
  M3.26.01.S1-01 | Elective 1.-3. / Opțional 1.-3. Fundamentals of Machine Learning / Fundamentele Învăţării Automate | Strong | 100 | Shares: machine, learning · Winter (sem 1)
  M024.25.03.F2-03 | Optimization in Machine Learning | Strong | 77 | Shares: machine, learning · Winter (sem 3)
  M3.26.01.S1-05 | Elective 1.-3. / Opțional 1.-3. Optimization in Machine Learning / Optimizare în Învățarea Automată | Strong | 77 | Shares: machine, learning · Winter (sem 1)

Computer Architecture  [PASS]  expect L002.25.03.F4
  L002.25.03.F4 | Computer Architectures / Arhitectura calculatoarelor | Strong | 100 | Shares: computer, architecture · Winter (sem 3)
  M024.26.01.F2 | Vehicle Architecture / Arhitectura unui vehicul | Partial | 53 | Shares: architecture · Winter (sem 1)
  L002.25.04.F3 | Computer Networks / Rețele de calculatoare | Partial | 48 | Shares: computer · Summer (sem 4)

Compiler Construction  [PASS]  expect L002.24.06.D2 or M1.26.01.S1-02
  M1.26.01.S1-02 | Elective 1.-3. / Opțional 1.-3. Compiler Design / Proiectarea Compilatoarelor | Partial | 49 | Shares: compiler · Winter (sem 1)
  L002.24.05.f11-02 | Computer assisted instruction / Instruire asistată de calculator | Weak | 16 | No shared words, similar spelling only · Winter (sem 5)
  L002.24.06.D2 | Compilation Techniques / Limbaje formale și tehnici de compilare | Weak | 12 | No shared words, similar spelling only · Summer (sem 6)

Computer Graphics  [PASS]  expect L002.24.06.F1 or M028.25.03.C3-03
  L002.24.06.F1 | Computer Graphics / Elemente de grafică | Strong | 100 | Shares: computer, graphic · Summer (sem 6)
  L002.25.04.F3 | Computer Networks / Rețele de calculatoare | Partial | 50 | Shares: computer · Summer (sem 4)
  L002.25.04.F5 | Digital Computers / Calculatoare numerice | Partial | 50 | Shares: computer · Summer (sem 4)

Computer Security  [PASS]  expect L002.24.06.S3-07
  L002.24.06.S3-07 | Elective 4.-6. Computer Security / Opțional 4.-6. Securitatea sistemelor de calcul | Strong | 100 | Shares: computer, security · Summer (sem 6)
  L002.25.04.F3 | Computer Networks / Rețele de calculatoare | Partial | 55 | Shares: computer, network · Summer (sem 4)
  L002.25.04.F5 | Digital Computers / Calculatoare numerice | Partial | 50 | Shares: computer · Summer (sem 4)

Natural Language Processing  [PASS]  expect M3.26.02.S1-03
  M3.26.02.S1-03 | Elective 4.-6. / Opțional 4.-6. Natural Language Processing / Procesarea Limbajului Natural | Strong | 100 | Shares: natural, language, processing · Summer (sem 2)
  L002.26.02.C6 | Foreign Languages 2 / Limbi Străine 2 | Weak | 39 | Shares: language · Summer (sem 2)
  L002.25.03.f11-01 | Foreign Language 3 / Limbă străină 3 | Weak | 39 | Shares: language · Winter (sem 3)

Digital Logic Design  [PASS]  expect L002.26.02.F5 or L002.25.03.F5
  L002.26.02.F5 | Digital Logic / Logică digitală | Strong | 80 | Shares: digital, logic · Summer (sem 2)
  L002.24.05.D2 | Digital Microsystem Design / Proiectarea microsistemelor digitale | Partial | 64 | Shares: digital, design · Winter (sem 5)
  L002.25.03.F5 | Digital Circuits and Signals / Circuite digitale | Partial | 42 | Shares: digital, circuit · Winter (sem 3)

Ancient Greek Philosophy (negative)  [PASS]
  L002.26.01.F3 | Physics / Fizică | Weak | 4 | No shared words, similar spelling only · Winter (sem 1)
  M028.25.03.F2-01 | Interactive Entertainment, Science, and Healthcare / Medii interactive în divertisment, știință și sănătate | Weak | 4 | No shared words, similar spelling only · Winter (sem 3)
  L002.24.06.F1 | Computer Graphics / Elemente de grafică | Weak | 3 | No shared words, similar spelling only · Summer (sem 6)

Organic Chemistry (negative)  [PASS]
  L002.26.02.F1 | Computer Assisted Mathematics / Matematici asistate de calculator | Weak | 4 | No shared words, similar spelling only · Summer (sem 2)
  L002.26.01.F2 | Algebra and Geometry / Algebră și geometrie | Weak | 4 | No shared words, similar spelling only · Winter (sem 1)
  L002.23.07.S2-07 | Elective 8.-11. Mechanical Engineering and Robotics / Opțional 8.-11. Elemente de robotică | Weak | 4 | No shared words, similar spelling only · Winter (sem 7)

mode=name pass threshold=10
GOLDEN 12/12 negative=PASS
```

### Golden printout, topic mode (`npm run golden -- --topics`)

```

Data Structures and Algorithms  [PASS]  expect L002.25.03.F2
  L002.25.03.F2 | Data Structures and Algorithms / Structuri de date și algoritmi | Strong | 85 | Both cover: trees, heaps, hash tables, sorting algorithms +1 more · Not at UPT: Lists, stacks, queues, complexity analysis
  L002.25.04.F1 | Algorithm Design and Analysis / Proiectarea și analiza algoritmilor | Strong | 73 | Both cover: complexity analysis · Not at UPT: Lists, stacks, queues, trees +4 more
  L002.26.01.F4 | Computer Programming / Programarea calculatoarelor | Strong | 72 | Both cover: sorting algorithms, graph algorithms · Not at UPT: Lists, stacks, queues, trees +3 more

Operating Systems  [PASS]  expect L002.25.04.F4
  L002.25.04.F4 | Operating Systems / Sisteme de operare | Strong | 100 | Both cover: CPU scheduling, memory management, file systems · Not at UPT: Processes, threads, synchronisation
  M4.25.03.S1-02 | Elective 7.-9. / Opțional 7.-9. Operating Systems for IoT / Sisteme de Operare pentru IoT | Partial | 67 | Both cover: CPU scheduling, file systems · Not at UPT: Processes, threads, memory management, synchronisation
  M1.26.02.S1-02 | Elective 4.-6. / Opțional 4.-6. Real Time Systems Design / Proiectarea Sistemelor Timp-Real | Partial | 61 | Both cover: CPU scheduling, file systems · Not at UPT: Processes, threads, memory management, synchronisation

Databases  [PASS]  expect L002.25.03.F1 or L002.23.07.S2-08 or L001.23.07.S2-08
  L002.25.03.F1 | Databases / Baze de date | Strong | 93 | Both cover: Relational model, SQL, transactions · Not at UPT: normalisation, ER modelling
  L001.23.07.S2-08 | Database Design / Proiectarea bazelor de date | Strong | 90 | Both cover: Relational model, SQL · Not at UPT: normalisation, transactions, ER modelling
  L002.23.07.S2-08 | Elective 8.-11. Database Design / Opțional 8.-11. Proiectarea bazelor de date | Strong | 87 | Both cover: Relational model, SQL, transactions · Not at UPT: normalisation, ER modelling

Computer Networks  [PASS]  expect L002.25.04.F3
  L002.25.04.F3 | Computer Networks / Rețele de calculatoare | Strong | 94 | Both cover: OSI, TCP/IP layers, routing, transport protocols +1 more · Not at UPT: switching
  M4.26.01.S1-02 | Elective 1.-3. / Opțional 1.-3. Communication Technologies in IoT and Cloud / Tehnologii de Comunicații în IoT și Cloud | Partial | 68 | Both cover: TCP/IP layers, transport protocols, network security basics · Not at UPT: OSI, routing, switching
  L002.24.06.S3-07 | Elective 4.-6. Computer Security / Opțional 4.-6. Securitatea sistemelor de calcul | Partial | 66 | Both cover: network security basics · Not at UPT: OSI, TCP/IP layers, routing, switching +1 more

Object-Oriented Programming  [PASS]  expect L002.25.03.F3
  L002.25.03.F3 | Object-Oriented Programming / Programarea orientată pe obiecte | Strong | 75 | Both cover: inheritance, polymorphism, exceptions, design in Java · Not at UPT: Classes, objects, interfaces
  M024.25.03.F2-06 | Java Technologies | Strong | 74 | Both cover: design in Java · Not at UPT: Classes, objects, inheritance, polymorphism +2 more
  L002.24.05.S5 | Software Systems Design / Proiectarea detaliată a sistemelor software | Partial | 66 | Both cover: objects, design in Java · Not at UPT: Classes, inheritance, polymorphism, interfaces +1 more

Fundamentals of Machine Learning  [PASS]  expect M3.26.01.S1-01
  M3.26.01.S1-01 | Elective 1.-3. / Opțional 1.-3. Fundamentals of Machine Learning / Fundamentele Învăţării Automate | Strong | 77 | Both cover: Supervised learning, regression, decision trees, model evaluation +1 more · Not at UPT: classification
  L002.24.06.S3-05 | Elective 4.-6. Data Mining / Opțional 4.-6. Explorarea datelor | Partial | 69 | Both cover: classification, decision trees · Not at UPT: Supervised learning, regression, model evaluation, clustering
  M024.26.01.F1 | Smart Vehicle Systems: AI Foundations / Elemente de inteligență artificială pentru vehicule inteligente | Partial | 47 | Both cover: Supervised learning, classification, decision trees, model evaluation · Not at UPT: regression, clustering

Computer Architecture  [PASS]  expect L002.25.03.F4
  L002.25.03.F4 | Computer Architectures / Arhitectura calculatoarelor | Strong | 83 | Both cover: Instruction set architecture, pipelining, cache memory hierarchy, processor datapath · Not at UPT: assembly language
  L002.25.04.F5 | Digital Computers / Calculatoare numerice | Partial | 69 | Both cover: assembly language · Not at UPT: Instruction set architecture, pipelining, cache memory hierarchy, processor datapath
  L002.25.04.F4 | Operating Systems / Sisteme de operare | Partial | 55 | No listed topic in common · Not at UPT: Instruction set architecture, pipelining, cache memory hierarchy, assembly language +1 more

Compiler Construction  [PASS]  expect L002.24.06.D2 or M1.26.01.S1-02
  L002.24.06.D2 | Compilation Techniques / Limbaje formale și tehnici de compilare | Strong | 93 | Both cover: Lexical analysis, syntax trees, semantic analysis, code generation · Not at UPT: parsing
  M1.26.01.S1-02 | Elective 1.-3. / Opțional 1.-3. Compiler Design / Proiectarea Compilatoarelor | Strong | 88 | Both cover: Lexical analysis, parsing, syntax trees, semantic analysis +1 more
  L002.24.05.S6-05 | Elective 3. Fundamental Concepts of Programming Languages / Opțional 3. Concepte fundamentale ale limbajelor de programare | Partial | 65 | Both cover: syntax trees, semantic analysis · Not at UPT: Lexical analysis, parsing, code generation

Computer Graphics  [PASS]  expect L002.24.06.F1 or M028.25.03.C3-03
  L002.24.06.F1 | Computer Graphics / Elemente de grafică | Strong | 100 | Both cover: 3D transformations, shading, lighting, OpenGL rendering pipeline · Not at UPT: Rasterisation, 2D
  M1.25.03.S1-02 | Elective 7.-9. / Opțional 7.-9. Graphics Processing Systems / Sisteme de Procesare Grafică | Strong | 92 | Both cover: 3D transformations · Not at UPT: Rasterisation, 2D, shading, lighting +1 more
  M028.25.03.C3-03 | Graphics and 3D Rendering / Grafică și redare 3D | Strong | 92 | No listed topic in common · Not at UPT: Rasterisation, 2D, 3D transformations, shading +2 more

Computer Security  [PASS]  expect L002.24.06.S3-07
  L002.24.06.S3-07 | Elective 4.-6. Computer Security / Opțional 4.-6. Securitatea sistemelor de calcul | Strong | 94 | Both cover: access control, network attacks · Not at UPT: Cryptography basics, authentication, software vulnerabilities
  M6.25.03.S1-02 | Elective 7.-9. / Opțional 7.-9. Web Security & Testing / Securitate și Testare Web | Strong | 77 | Both cover: authentication · Not at UPT: Cryptography basics, access control, software vulnerabilities, network attacks
  M4.25.03.S1-01 | Elective 7.-9. / Opțional 7.-9. Security and Privacy in IoT and Cloud / Securitate și Confidențialitate în IoT și Cloud | Strong | 73 | Both cover: access control · Not at UPT: Cryptography basics, authentication, software vulnerabilities, network attacks

Natural Language Processing  [PASS]  expect M3.26.02.S1-03
  M3.26.02.S1-03 | Elective 4.-6. / Opțional 4.-6. Natural Language Processing / Procesarea Limbajului Natural | Strong | 82 | Both cover: language models, part-of-speech tagging, word embeddings · Not at UPT: Tokenisation, text classification
  M3.25.03.S1-03 | Elective 7.-9. / Opțional 7.-9. Text Mining and Recommender Systems / Explorarea Textului și Sisteme de Recomandare | Partial | 53 | Both cover: word embeddings, text classification · Not at UPT: Tokenisation, language models, part-of-speech tagging
  M3.26.01.S1-02 | Elective 1.-3. / Opțional 1.-3. Deep Learning / Învăţare Profundă | Partial | 40 | Both cover: language models · Not at UPT: Tokenisation, part-of-speech tagging, word embeddings, text classification

Digital Logic Design  [PASS]  expect L002.26.02.F5 or L002.25.03.F5
  L002.26.02.F5 | Digital Logic / Logică digitală | Strong | 97 | Both cover: Boolean algebra, logic gates, combinational circuits, finite state machines · Not at UPT: flip-flops
  L002.25.04.F5 | Digital Computers / Calculatoare numerice | Strong | 88 | Both cover: logic gates, combinational circuits · Not at UPT: Boolean algebra, flip-flops, finite state machines
  L002.25.03.F5 | Digital Circuits and Signals / Circuite digitale | Strong | 80 | Both cover: logic gates, combinational circuits · Not at UPT: Boolean algebra, flip-flops, finite state machines

Ancient Greek Philosophy (negative)  [PASS]
  L002.24.06.C6-09 | Elective 7. Culture and Civilization / Opțional 7. Cultură și civilizație | Weak | 27 | No listed topic in common · Not at UPT: Presocratics, Plato, Aristotle, ethics +1 more
  M4.26.02.C5 | Academic Ethics and Integrity / Etică și Integritate Academică | Weak | 27 | Both cover: ethics · Not at UPT: Presocratics, Plato, Aristotle, metaphysics
  M5.26.02.C5 | Academic Ethics and Integrity / Etică și Integritate Academică | Weak | 24 | No listed topic in common · Not at UPT: Presocratics, Plato, Aristotle, ethics +1 more

Organic Chemistry (negative)  [PASS]
  M5.26.01.S1-02 | Elective 1.-3. / Opțional 1.-3. Fundamentals of Quantum Physics / Fundamentele Fizicii Cuantice | Weak | 25 | No listed topic in common · Not at UPT: Hydrocarbons, functional groups, reaction mechanisms, stereochemistry +1 more
  L002.24.06.C7 | Microeconomics / Microeconomie | Weak | 23 | No listed topic in common · Not at UPT: Hydrocarbons, functional groups, reaction mechanisms, stereochemistry +1 more
  L002.26.01.F6 | Electrical Engineering / Fundamente de inginerie electrică | Weak | 22 | No listed topic in common · Not at UPT: Hydrocarbons, functional groups, reaction mechanisms, stereochemistry +1 more

mode=topics pass threshold=9
GOLDEN 12/12 negative=PASS
```

## Overfitting review (D-19)

**Synonym map (12 entries, `src/domain/normalise.ts`):** os -> operating systems, oop -> object oriented programming, db -> database, dbms -> database management systems, ai -> artificial intelligence, ml -> machine learning, nlp -> natural language processing, cv -> computer vision, hci -> human computer interaction, se -> software engineering, dsp -> digital signal processing, networking -> networks.

**Stopwords:** of, and, the, in, to, for, a, an, with, on, introduction, fundamentals, fundamental, basics, basic, i, ii, iii, iv, elective, optional (plus any all-digit token, and a plural-"s" stem that skips words ending in ss/is/us).

**Verdict: not tuned to the golden set; no change made.**
- Every synonym is a common abbreviation a student would type (the D-19 examples plus nlp, cv, hci, se, dsp, dbms) or a plain word-form variant (networking). No golden home name or description contains any of these abbreviations, so no golden case can use them.
- Ablation: with `SYNONYMS = {}` the name-mode gate still prints `GOLDEN 12/12 negative=PASS`; with "elective"/"optional" removed from the stopwords it also stays `12/12`. Both edits were reverted (`git checkout`), nothing committed.
- The honest caveat is the golden set, not the map: most golden home names are the catalogue's own English names ("Operating Systems", "Computer Networks", "Computer Graphics"...), so name mode scores 100 on them by construction. The only non-trivial name cases are "Database Systems" -> "Databases" (68, via plural stem), "Compiler Construction" -> "Compiler Design" (49) with "Compilation Techniques" only at 12 (no shared word), and "Digital Logic Design" -> "Digital Logic" (80). 12/12 overstates name mode for real student inputs that use different wording (e.g. "Programming Paradigms", "Systems Programming", "Theory of Computation"); topic mode is the answer for those.

**Topic mode leakage check:** the expected courses' inferred topics share 0-2 verbatim phrases with the golden descriptions (DSA 2/9, OS 2/6, DB 0/5, Networks 1/6, OOP 0/7, ML 0/6, Architecture 2/5, Compilers 2/5 and 0/5, Graphics 0/6 and 0/6, Security 0/5, NLP 1/5, Logic 2/5 and 1/5), all standard textbook terms ("CPU scheduling", "hash tables", "boolean algebra"); their topic counts (5-8) match the rest of the catalogue. No golden description was copied into course topics. Two softer points: the enrich prompt uses "CPU scheduling" as its example of a concrete topic, and SIM_FLOOR/SIM_CEIL (band mapping only, not ranking) were calibrated on this same golden run, so "negatives stay Weak" in topic mode is an in-sample result.

## taskType on GEMINI_EMBED_MODEL

`src/llm/gemini.ts` passes `config: { taskType, outputDimensionality: 768 }`; @google/genai sends it as `requests[].taskType` in batchEmbedContents. The API **accepts** it (no 400; 204 documents embedded, smoke and golden queries work) but **ignores** it on gemini-embedding-2: a one-off probe through a temporary npm script (removed afterwards) embedded the same text as RETRIEVAL_DOCUMENT and RETRIEVAL_QUERY and got `dims=768/768 cos(doc,query)=1.000000 identical=true`. Matching still works because both sides are embedded the same way (symmetric similarity). If asymmetric retrieval is wanted later, check the gemini-embedding-2 docs for how it takes the task (likely a text prefix); not done here (golden passes, no need).

## Interfaces for later plans

- `src/services/matcher.ts`
  - `type HomeCourseInput = { name: string; description?: string | null; topics: string[]; ects?: number | null; studyYear?: number | null }`
  - `type MatchMode = "name" | "topics"`; `type Evidence = "syllabus" | "inferred" | "catalogue"`; `EVIDENCE_LABEL: Record<Evidence, string>`
  - `type MatchView = RankedMatch & { courseId, code, name, facultyCode, facultyName, programme, level: string; studyYear, semester: number; season: Season; ects: number; languageLabel: string | null; hasSyllabus: boolean; evidence: Evidence; evidenceLabel: string; coordinator: { name: string | null; email: string; sourceUrl: string } }`
  - `matchByName(input: HomeCourseInput, filter: SemesterFilter): Promise<RankedMatch[]>`
  - `matchByTopics(topics: string[], filter: SemesterFilter): Promise<RankedMatch[]>` (throws `GeminiUnavailableError`)
  - `enrichMatches(ranked: RankedMatch[], mode: MatchMode): Promise<MatchView[]>`
  - `matchHomeCourse(userId: string, homeCourseId: string): Promise<{ homeCourseId; filter: SemesterFilter; mode: MatchMode; matches: MatchView[] }>` (throws `NotFoundError`)
- `src/domain/matches.ts`: `type RawMatch = { id; score; reason; coveredTopics; missingTopics }`, `type RankedMatch = RawMatch & { band: Band }`, `MAX_MATCHES = 5`, `finaliseMatches(raw)`, `topicOverlap(homeTopics, courseTopics)`
- `src/llm/gemini.ts`: `class GeminiUnavailableError`, `type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"`, `EMBED_DIMS = 768`, `embed(texts: string[], taskType: EmbedTaskType): Promise<number[][]>`, `generateJson<S extends z.ZodType>(prompt: string, schema: S): Promise<z.infer<S>>` (uses GEMINI_MODEL with `responseJsonSchema`; this is what 01-04 syllabus extraction should call, adding file parts if needed)
- `src/domain/bands.ts`: `BAND_THRESHOLDS`, `cleanScore`, `toBand`, `SIM_FLOOR`, `SIM_CEIL`, `similarityToScore`
- npm scripts: `topics:enrich [-- --force]`, `embed:courses [-- --force]`, `smoke:match`, `golden [-- --topics] [-- --limit N]`, plus `db:up`, `db:push`, `db:seed`, `catalogue:import`, `smoke:catalogue`, `smoke:auth`, `test`, `build`, `lint`

## Deviations from Plan

The plan body (one Claude call over a prompt-cached catalogue) was replaced by the D-18/D-19/D-20 scope overrides; the items below are the remaining differences from the overrides and the plan's contract.

1. **No `src/llm/claude.ts`, `schemas.ts`, `prompts.ts`, `src/lib/rate-limit.ts`, `match_cache` use, `ids.ts` or `matchCacheKey`** (D-19/D-20). Invented-id validation is unnecessary because ids come from our own SQL rows; `finaliseMatches` still dedupes and sorts.
2. **`/api/matches` has no 401 and no rate limit**: D-18 mock student is always signed in; the only paid-ish path is the free-tier embed call. `force` is accepted and ignored (no cache).
3. **Response carries `mode`** (`"name" | "topics"`) and MatchView carries `evidence: "inferred"` plus `evidenceLabel`, beyond the plan's two-value evidence: needed for the D-20 "Topics inferred from course name" label.
4. **Topic mode is chosen by data, not by a UI switch**: home course with topics -> topic mode. The current Matcher form sends no topics, so the UI is name mode only until 01-04 adds syllabus upload.
5. **Golden thresholds**: name >= 10/12 (D-19 "what name matching realistically reaches"), topics >= 9/12; no "CACHE OK" line (no prompt cache). The golden runner uses `--topics`/`--limit`, not `--no-cache`.
6. **Inferred topics are 5-8 per course** (D-20 said 5-12; enrich accepts up to 12, the model returned at most 8).
7. **Each text is sent as its own Content** in `embed()`: gemini-embedding-2 merges a plain string array into one embedding.
8. **`taskType` has no effect** on gemini-embedding-2 (see above); kept in the call since it is harmless and documents intent.

## Issues Encountered

- First attempt at the taskType probe failed on top-level await (package is CJS for tsx); wrapped in `main()`.
- Free-tier embed quota counts each text as a request (100/min): `embed:courses` sends 50 per chunk with 35 s pauses; the topic golden run took about 3 minutes.

## User Setup Required

None new (GEMINI_API_KEY, GEMINI_MODEL, GEMINI_EMBED_MODEL already in `.env.local`).

## Next Phase Readiness

- 01-04 (syllabus upload) can call `generateJson` for extraction, store topics on `home_course`, and `/api/matches` switches to topic mode automatically.
- Open human checks:
  1. Plan human-check: open http://localhost:3000/matcher, type "Database Systems" with description "SQL, relational model, normalisation, transactions, ER modelling"; expect up to 5 cards with the AC dot, "Compared by catalogue entry", a reason that does not overclaim, fact chips without percentages, and the suggestions-only notice with the AC coordinator.
  2. Reason quality: name-mode reasons are a word list ("Shares: database · Winter (sem 3)"), and Weak rows can read "No shared words, similar spelling only"; decide if that is clear enough for students.
  3. Weak greying: check `.band-Weak` cards look de-emphasised but still readable (contrast of `--sub` on `--ground`).
  4. Golden ground truth (plan Task 2 human-check): are the top-3 courses ones a coordinator would plausibly accept?

---
*Phase: 01-course-matcher*
*Completed: 2026-11-21*
