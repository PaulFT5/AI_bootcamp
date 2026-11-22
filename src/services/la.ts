import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { course, faculty, homeCourse, laItem } from "@/db/schema";
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
