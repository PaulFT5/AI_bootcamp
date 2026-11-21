// Offline (D-20): infer 5-12 English topics per AC course from its name with GEMINI_MODEL.
// Writes data/seed/course-topics.json; `npm run db:seed` applies it. A fișa replaces these later (01-06).
// Run: npm run topics:enrich [-- --force]   (skips ids already in the file unless --force)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { generateJson } from "../src/llm/gemini";
import type { CourseSeed } from "./lib/catalogue-parse";

type TopicSeed = { id: string; topics: string[]; topicsSource: "inferred" };

const OUT = "data/seed/course-topics.json";
const BATCH = 25;
const PAUSE_MS = 5000; // free tier: stay well under the per-minute request limit
const MIN_TOPICS = 5;
const MAX_TOPICS = 12;

const Out = z.object({ courses: z.array(z.object({ id: z.string(), topics: z.array(z.string()) })) });

const courses: CourseSeed[] = JSON.parse(readFileSync("data/seed/catalogue.json", "utf8"));
const force = process.argv.includes("--force");
const done = new Map<string, TopicSeed>(
  existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as TopicSeed[]).map((t) => [t.id, t]) : [],
);

const prompt = (batch: CourseSeed[]) => `You list the subject matter of university courses.
For each course below (Faculty of Automation and Computers, Politehnica University of Timișoara), give ${MIN_TOPICS}-${MAX_TOPICS} short English topics (2-5 words each) that a course with this name typically covers.
Names are bilingual "English / Romanian"; "Elective N / Opțional N" is only a slot label. Topics are concrete subject matter (e.g. "CPU scheduling", "relational algebra"), not course logistics, not the course name itself.
Return every id exactly as given.

${batch.map((c) => `${c.id} | ${c.name.replace(/\s+/g, " ")} | programme: ${c.programme} (${c.level === "M" ? "Master" : "Bachelor"})`).join("\n")}`;

// Keeps the courses that came back with enough topics (extras cut at MAX_TOPICS); the others stay for a rerun.
async function runBatch(batch: CourseSeed[]) {
  const { courses: got } = await generateJson(prompt(batch), Out);
  const byId = new Map(got.map((c) => [c.id, c.topics.map((t) => t.trim()).filter(Boolean).slice(0, MAX_TOPICS)]));
  const ok = batch.filter((c) => (byId.get(c.id)?.length ?? 0) >= MIN_TOPICS);
  if (!ok.length) throw new Error("no course came back with enough topics");
  const short = batch.filter((c) => !ok.includes(c));
  if (short.length) console.warn(`too few topics, left for a rerun: ${short.map((c) => c.id).join(", ")}`);
  return ok.map((c): TopicSeed => ({ id: c.id, topics: byId.get(c.id)!, topicsSource: "inferred" }));
}

const save = () =>
  writeFileSync(
    OUT,
    JSON.stringify(courses.filter((c) => done.has(c.id)).map((c) => done.get(c.id)), null, 2) + "\n",
  );

async function main() {
  const todo = force ? courses : courses.filter((c) => !done.has(c.id)); // --force keeps old topics for a batch that fails
  console.log(`courses=${courses.length} todo=${todo.length}`);
  let failed = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    if (i) await new Promise((r) => setTimeout(r, PAUSE_MS));
    let rows: TopicSeed[] | undefined;
    for (let attempt = 1; attempt <= 2 && !rows; attempt++) {
      try {
        rows = await runBatch(batch);
      } catch (e) {
        console.warn(`batch ${i / BATCH + 1} attempt ${attempt} failed: ${e instanceof Error ? e.message : e} ${(e as Error)?.cause ?? ""}`);
        if (attempt === 1) await new Promise((r) => setTimeout(r, PAUSE_MS));
      }
    }
    failed += batch.length - (rows?.length ?? 0);
    if (!rows) continue;
    for (const r of rows) done.set(r.id, r);
    save(); // after every batch, so a rerun resumes
    console.log(`batch ${i / BATCH + 1}: ${rows.length} courses`);
  }
  console.log(`topics=${done.size}/${courses.length} failed=${failed}`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
