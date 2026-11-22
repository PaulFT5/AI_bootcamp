// Idempotent seed: AC faculty + catalogue courses in one transaction, upsert by id, never deletes.
// Run: npm run db:seed (after npm run db:push and npm run catalogue:import)
import { existsSync, readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { course, faculty } from "../src/db/schema";
import type { CourseSeed } from "./lib/catalogue-parse";

type FacultySeed = typeof faculty.$inferInsert;
const read = <T>(f: string): T => JSON.parse(readFileSync(f, "utf8"));
const faculties = read<FacultySeed[]>("data/seed/coordinators.json");
const courses = read<CourseSeed[]>("data/seed/catalogue.json");
// D-20 inferred topics (npm run topics:enrich); optional so a fresh clone can seed without them.
const TOPICS = "data/seed/course-topics.json";
const topics = existsSync(TOPICS) ? read<{ id: string; topics: string[]; topicsSource: string }[]>(TOPICS) : [];

// Every imported column; hasSyllabus and embedding are never overwritten here, topics only from course-topics.json below.
const COURSE_COLS = [
  "facultyCode", "level", "programme", "field", "programmeDesc", "name", "code", "studyYear", "semester",
  "ects", "listedLanguage", "languageLabel", "sourceYear", "sourceFile", "sourceRow",
] as const;
const excluded = (col: { name: string }) => sql.raw(`excluded."${col.name}"`);

async function main() {
  await db.transaction(async (tx) => {
    for (const f of faculties) {
      await tx
        .insert(faculty)
        .values(f)
        .onConflictDoUpdate({
          target: faculty.code,
          set: { name: f.name, coordinatorName: f.coordinatorName, coordinatorEmail: f.coordinatorEmail, sourceUrl: f.sourceUrl, checkedOn: f.checkedOn },
        });
    }
    for (let i = 0; i < courses.length; i += 200) {
      await tx
        .insert(course)
        .values(courses.slice(i, i + 200))
        .onConflictDoUpdate({
          target: course.id,
          set: Object.fromEntries(COURSE_COLS.map((c) => [c, excluded(course[c])])),
        });
    }
    // Never replaces syllabus topics (01-06 owns those).
    // shortcut: changed topics keep their old embedding, rerun npm run embed:courses -- --force after editing topics
    if (topics.length)
      await tx.execute(sql`
        update course c set topics = t.topics, topics_source = t."topicsSource"
        from jsonb_to_recordset(${JSON.stringify(topics)}::jsonb) as t(id text, topics jsonb, "topicsSource" text)
        where c.id = t.id and c.topics_source is distinct from 'syllabus'`);
  });
  const [{ f }] = (await db.execute<{ f: number }>(sql`select count(*)::int as f from faculty`)).rows;
  const [{ c }] = (await db.execute<{ c: number }>(sql`select count(*)::int as c from course`)).rows;
  const [{ t }] = (await db.execute<{ t: number }>(sql`select count(*)::int as t from course where topics_source is not null`)).rows;
  console.log(`faculty=${f} course=${c} topics=${t}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
