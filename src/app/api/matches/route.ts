import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { GeminiUnavailableError } from "@/llm/gemini";
import { matchHomeCourse, NotFoundError } from "@/services/matcher";

export const maxDuration = 60;

// `force` stays in the contract; with no match cache (D-19) every request ranks afresh, so it has no effect.
const Body = z.object({ homeCourseId: z.uuid(), force: z.boolean().optional() });

export async function POST(req: Request) {
  const user = await getSessionUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  try {
    return Response.json(await matchHomeCourse(user.id, parsed.data.homeCourseId));
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
