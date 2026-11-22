import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { GeminiUnavailableError } from "@/llm/gemini";
import { matchHomeCourse, NotFoundError } from "@/services/matcher";

export const maxDuration = 60;

// force: skip the match cache (D-09 "Re-run matching"); byName: name mode even when the course has topics (D-20 fallback)
const Body = z.object({ homeCourseId: z.uuid(), force: z.boolean().optional(), byName: z.boolean().optional() });

export async function POST(req: Request) {
  const user = await getSessionUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  const { homeCourseId, ...opts } = parsed.data;
  try {
    return Response.json(await matchHomeCourse(user.id, homeCourseId, opts));
  } catch (e) {
    if (e instanceof NotFoundError) return Response.json({ error: "not_found" }, { status: 404 });
    if (e instanceof GeminiUnavailableError)
      return Response.json(
        {
          error: "model_unavailable",
          message: "Could not match this course by topics right now. Try again, or match it by name.",
        },
        { status: 502 },
      );
    throw e;
  }
}
