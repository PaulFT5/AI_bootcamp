import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { course, faculty, homeCourse, laItem } from "@/db/schema";
import { LA_CSV_HEADER, type CsvCell } from "@/domain/csv";
import { season } from "@/domain/semester";

// Default strip mode: an extra `semester` or `season` key is dropped, never stored (D-12 clarified).
export const LaAddBody = z.object({ courseId: z.string().min(1).max(40), homeCourseId: z.uuid().nullable() });

/** The user's draft, Winter before Summer, then code, then course id. Season comes only from the catalogue row. */
export async function listLa(userId: string) {
  const rows = await db
    .select({
      id: laItem.id,
      courseId: course.id,
      code: course.code,
      name: course.name,
      facultyCode: course.facultyCode,
      facultyName: faculty.name,
      programme: course.programme,
      studyYear: course.studyYear,
      semester: course.semester,
      ects: course.ects,
      homeCourseId: laItem.homeCourseId,
      homeCourseName: homeCourse.name,
      homeCourseEcts: homeCourse.ects,
      coordinatorName: faculty.coordinatorName,
      coordinatorEmail: faculty.coordinatorEmail,
      sourceUrl: faculty.sourceUrl,
      checkedOn: faculty.checkedOn,
    })
    .from(laItem)
    .innerJoin(course, eq(laItem.courseId, course.id))
    .innerJoin(faculty, eq(course.facultyCode, faculty.code))
    .leftJoin(homeCourse, and(eq(laItem.homeCourseId, homeCourse.id), eq(homeCourse.userId, userId)))
    .where(eq(laItem.userId, userId))
    .orderBy(sql`${course.semester} % 2 = 0`, asc(course.code), asc(course.id));
  return rows.map(({ coordinatorName, coordinatorEmail, sourceUrl, checkedOn, ...r }) => ({
    ...r,
    season: season(r.semester),
    coordinator: { name: coordinatorName, email: coordinatorEmail, sourceUrl, checkedOn },
  }));
}
export type LaRow = Awaited<ReturnType<typeof listLa>>[number];

const ownsHomeCourse = async (userId: string, id: string) =>
  (await db.select({ id: homeCourse.id }).from(homeCourse).where(and(eq(homeCourse.id, id), eq(homeCourse.userId, userId))))
    .length > 0;

/** "created" | "exists", or null when the course or the home course (of this user) does not exist. */
export async function addLa(userId: string, courseId: string, homeCourseId: string | null) {
  const [c] = await db.select({ id: course.id }).from(course).where(eq(course.id, courseId));
  if (!c || (homeCourseId && !(await ownsHomeCourse(userId, homeCourseId)))) return null;
  const inserted = await db
    .insert(laItem)
    .values({ userId, courseId, homeCourseId })
    .onConflictDoNothing({ target: [laItem.userId, laItem.courseId] })
    .returning({ id: laItem.id });
  return inserted.length ? "created" : "exists";
}

export async function removeLa(userId: string, courseId: string) {
  await db.delete(laItem).where(and(eq(laItem.userId, userId), eq(laItem.courseId, courseId)));
}

export const LaRelinkBody = z.object({ homeCourseId: z.uuid().nullable() }); // strip mode: semester/season dropped

/** Changes only the home-course link (D-11), never the placement. False unless the row and the home course are the user's. */
export async function relinkLa(userId: string, laItemId: string, homeCourseId: string | null) {
  if (homeCourseId && !(await ownsHomeCourse(userId, homeCourseId))) return false;
  const updated = await db
    .update(laItem)
    .set({ homeCourseId })
    .where(and(eq(laItem.id, laItemId), eq(laItem.userId, userId)))
    .returning({ id: laItem.id });
  return updated.length > 0;
}

/** D-13 rows in listLa order, header first. */
export async function laCsvRows(userId: string): Promise<CsvCell[][]> {
  const rows = await listLa(userId);
  return [
    LA_CSV_HEADER,
    ...rows.map((r) => [
      r.season,
      r.code,
      r.name,
      r.facultyName,
      r.programme,
      r.studyYear,
      r.ects,
      r.homeCourseName ?? "",
      r.homeCourseEcts ?? "",
    ]),
  ];
}

/** Coordinator contacts for the print view: the draft's faculties, or AC when the draft is empty (D-17). */
export async function laCoordinators(rows: LaRow[]) {
  const codes = [...new Set(rows.map((r) => r.facultyCode))];
  return db
    .select()
    .from(faculty)
    .where(inArray(faculty.code, codes.length ? codes : ["AC"]))
    .orderBy(asc(faculty.code));
}
