import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { LaRelinkBody, relinkLa } from "@/services/la";

export async function PATCH(req: Request, ctx: RouteContext<"/api/la/[id]">) {
  const user = await getSessionUser();
  const { id } = await ctx.params;
  const parsed = LaRelinkBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  if (!z.uuid().safeParse(id).success || !(await relinkLa(user.id, id, parsed.data.homeCourseId)))
    return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
