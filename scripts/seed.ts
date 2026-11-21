// Idempotent seed: AC faculty + catalogue courses in one transaction, upsert by id, never deletes.
// Run: npm run db:seed (after npm run db:push and npm run catalogue:import)
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { course, faculty } from "../src/db/schema";
import type { CourseSeed } from "./lib/catalogue-parse";

type FacultySeed = typeof faculty.$inferInsert;
const read = <T>(f: string): T => JSON.parse(readFileSync(f, "utf8"));
const faculties = read<FacultySeed[]>("data/seed/coordinators.json");
const courses = read<CourseSeed[]>("data/seed/catalogue.json");

// Every imported column; hasSyllabus, topics and embedding belong to later plans and are never overwritten here.
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
  });
  const [{ f }] = (await db.execute<{ f: number }>(sql`select count(*)::int as f from faculty`)).rows;
  const [{ c }] = (await db.execute<{ c: number }>(sql`select count(*)::int as c from course`)).rows;
  console.log(`faculty=${f} course=${c}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
