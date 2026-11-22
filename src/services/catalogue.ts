import { and, asc, count, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { course, faculty } from "@/db/schema";

// No faculty filter (D-17, all AC) and no language filter (D-03: listed language is display-only).
export type CatalogueFilters = {
  semester?: "winter" | "summer";
  ects?: number;
  hasSyllabus?: boolean;
  q?: string;
  sort?: "name" | "ects";
};

export async function listCourses(f: CatalogueFilters = {}) {
  const where: (SQL | undefined)[] = [];
  // D-04 parity: odd catalogue semesters are winter, even are summer
  if (f.semester) where.push(f.semester === "winter" ? sql`course.semester % 2 = 1` : sql`course.semester % 2 = 0`);
  if (f.ects !== undefined) where.push(eq(course.ects, f.ects));
  if (f.hasSyllabus) where.push(eq(course.hasSyllabus, true));
  const q = f.q?.trim().slice(0, 100);
  if (q) where.push(or(ilike(course.name, `%${q}%`), ilike(course.code, `%${q}%`)));

  return db
    .select({
      id: course.id,
      code: course.code,
      name: course.name,
      ects: course.ects,
      studyYear: course.studyYear,
      semester: course.semester,
      programme: course.programme,
      languageLabel: course.languageLabel,
      hasSyllabus: course.hasSyllabus,
      facultyCode: course.facultyCode,
      facultyName: faculty.name,
    })
    .from(course)
    .innerJoin(faculty, eq(course.facultyCode, faculty.code))
    .where(and(...where))
    .orderBy(...(f.sort === "ects" ? [asc(course.ects)] : []), asc(course.name), asc(course.id));
}

export async function catalogueFacets() {
  const [ects, [stats]] = await Promise.all([
    db.selectDistinct({ ects: course.ects }).from(course).orderBy(asc(course.ects)),
    db
      .select({
        sourceYear: sql<string>`min(${course.sourceYear})`,
        withSyllabus: sql<number>`count(*) filter (where ${course.hasSyllabus})::int`,
        total: count(),
      })
      .from(course),
  ]);
  return { ects: ects.map((r) => r.ects), sourceYear: stats.sourceYear ?? "2026-27", withSyllabus: stats.withSyllabus, total: stats.total };
}
