import { MAX_UPLOAD_BYTES, sniffKind, uploadError } from "@/domain/upload";
import { getSessionUser } from "@/lib/session";
import { GeminiUnavailableError } from "@/llm/gemini";
import { extractCourse } from "@/services/extract";

export const maxDuration = 60;

const fail = (status: number, message: string) => Response.json({ error: "upload_rejected", message }, { status });

// POST multipart { file } -> pre-fill values for the course form (MATCH-04). Nothing is stored.
// shortcut: no per-user rate limit (single mock student, D-18); add one before public user testing
export async function POST(req: Request) {
  await getSessionUser();
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, uploadError(length, "pdf")!); // refuse before reading the body
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return fail(400, "Choose a PDF, PNG or JPEG file to upload.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffKind(bytes);
  const error = uploadError(bytes.length, kind);
  if (error || !kind) return fail(bytes.length === 0 ? 400 : bytes.length > MAX_UPLOAD_BYTES ? 413 : 415, error!);
  try {
    return Response.json(await extractCourse(bytes, kind));
  } catch (e) {
    if (!(e instanceof GeminiUnavailableError)) throw e;
    console.error("extract failed", e.cause);
    return Response.json(
      {
        error: "model_unavailable",
        message: "We could not read this file right now. Try again in a minute, or search by name instead.",
      },
      { status: 502 },
    );
  }
}
