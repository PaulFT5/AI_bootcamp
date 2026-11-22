import { getSessionUser } from "@/lib/session";
import { addLa, LaAddBody, listLa, removeLa } from "@/services/la";

export async function GET() {
  const user = await getSessionUser();
  return Response.json(await listLa(user.id));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  const parsed = LaAddBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  const result = await addLa(user.id, parsed.data.courseId, parsed.data.homeCourseId);
  if (!result) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ result }, { status: result === "created" ? 201 : 200 });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  const courseId = new URL(req.url).searchParams.get("courseId");
  if (!courseId || courseId.length > 40) return Response.json({ error: "invalid_input" }, { status: 400 });
  await removeLa(user.id, courseId);
  return new Response(null, { status: 204 });
}
