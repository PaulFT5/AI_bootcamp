import { getSessionUser } from "@/lib/session";
import { createHomeCourse, HomeCourseBody, listHomeCourses } from "@/services/home-courses";

export async function GET() {
  const user = await getSessionUser();
  return Response.json(await listHomeCourses(user.id));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  const parsed = HomeCourseBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  return Response.json(await createHomeCourse(user.id, parsed.data), { status: 201 });
}
