import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { homeCourse } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

// D-07: only the name is required. Caps are JS string lengths (UTF-16 code units).
const Body = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(8000).nullable().optional(),
  topics: z.array(z.string().max(200)).max(30).optional(),
  ects: z.number().min(0.5).max(60).multipleOf(0.5).nullable().optional(),
  studyYear: z.number().int().min(1).max(6).nullable().optional(),
  source: z.enum(["typed", "syllabus"]).optional(),
});

export async function GET() {
  const user = await getSessionUser();
  const rows = await db.select().from(homeCourse).where(eq(homeCourse.userId, user.id)).orderBy(asc(homeCourse.createdAt));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;
  const [row] = await db
    .insert(homeCourse)
    .values({
      userId: user.id,
      name: b.name,
      description: b.description?.trim() || null,
      topics: (b.topics ?? []).map((t) => t.trim()).filter(Boolean),
      ects: b.ects ?? null,
      studyYear: b.studyYear ?? null,
      source: b.source ?? "typed",
    })
    .returning();
  return Response.json(row, { status: 201 });
}
