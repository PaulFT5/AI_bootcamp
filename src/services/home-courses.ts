import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { homeCourse, type HomeCourse } from "@/db/schema";
import { lastMatchesFor } from "@/services/matcher";

// D-07: only the name is required. Caps are JS string lengths (UTF-16 code units).
export const HomeCourseBody = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(8000).nullable().optional(),
  topics: z.array(z.string().max(200)).max(30).optional(),
  ects: z.number().min(0.5).max(60).multipleOf(0.5).nullable().optional(),
  studyYear: z.number().int().min(1).max(6).nullable().optional(),
  source: z.enum(["typed", "syllabus"]).optional(),
});
type Body = z.infer<typeof HomeCourseBody>;

// Only fields present in the body are written, so PATCH can send a subset.
const toRow = (b: Partial<Body>) => ({
  ...(b.name !== undefined && { name: b.name }),
  ...(b.description !== undefined && { description: b.description?.trim() || null }),
  ...(b.topics !== undefined && { topics: b.topics.map((t) => t.trim()).filter(Boolean) }),
  ...(b.ects !== undefined && { ects: b.ects }),
  ...(b.studyYear !== undefined && { studyYear: b.studyYear }),
  ...(b.source !== undefined && { source: b.source }),
});

const view = async (h: HomeCourse) => ({
  id: h.id,
  name: h.name,
  description: h.description,
  topics: h.topics,
  ects: h.ects,
  studyYear: h.studyYear,
  source: h.source as "typed" | "syllabus",
  last: await lastMatchesFor(h),
});
export type HomeCourseView = Awaited<ReturnType<typeof view>>;

const own = (userId: string, id: string) => and(eq(homeCourse.id, id), eq(homeCourse.userId, userId));

/** The user's courses, oldest first, each with its last match result (D-09). */
export async function listHomeCourses(userId: string): Promise<HomeCourseView[]> {
  const rows = await db.select().from(homeCourse).where(eq(homeCourse.userId, userId)).orderBy(asc(homeCourse.createdAt));
  return Promise.all(rows.map(view));
}

export async function createHomeCourse(userId: string, b: Body) {
  const [row] = await db.insert(homeCourse).values({ userId, ...toRow(b), name: b.name }).returning();
  return view(row);
}

/** Edits clear the last result (D-09); null when the course is not the user's. */
export async function updateHomeCourse(userId: string, id: string, b: Partial<Body>) {
  const [row] = await db
    .update(homeCourse)
    .set({ ...toRow(b), matchHash: null, updatedAt: new Date() })
    .where(own(userId, id))
    .returning();
  return row ? view(row) : null;
}

/** la_item.homeCourseId becomes null through the FK. False when the course is not the user's. */
export async function deleteHomeCourse(userId: string, id: string) {
  return (await db.delete(homeCourse).where(own(userId, id)).returning({ id: homeCourse.id })).length > 0;
}
