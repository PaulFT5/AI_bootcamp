import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { course, faculty } from "@/db/schema";

export async function listCourses() {
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
    .orderBy(asc(course.name), asc(course.id));
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
