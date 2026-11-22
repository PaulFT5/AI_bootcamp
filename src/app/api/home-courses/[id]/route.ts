import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { deleteHomeCourse, HomeCourseBody, updateHomeCourse } from "@/services/home-courses";

const notFound = () => Response.json({ error: "not_found" }, { status: 404 });
const isId = (id: string) => z.uuid().safeParse(id).success;

export async function PATCH(req: Request, ctx: RouteContext<"/api/home-courses/[id]">) {
  const user = await getSessionUser();
  const { id } = await ctx.params;
  if (!isId(id)) return notFound();
  const parsed = HomeCourseBody.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  const updated = await updateHomeCourse(user.id, id, parsed.data);
  return updated ? Response.json(updated) : notFound();
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/home-courses/[id]">) {
  const user = await getSessionUser();
  const { id } = await ctx.params;
  if (!isId(id) || !(await deleteHomeCourse(user.id, id))) return notFound();
  return new Response(null, { status: 204 });
}
