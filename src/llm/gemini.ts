// The only Gemini client (D-20). Server code and offline scripts only: never import from a client component.
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";

export class GeminiUnavailableError extends Error {
  constructor(cause: unknown) {
    super("The AI service is busy or unavailable right now. Try again in a minute.", { cause });
  }
}

export type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export const EMBED_DIMS = 768;
const EMBED_BATCH = 100; // Gemini API batch limit per embed request
const RETRY_AFTER_MS = 3000;

let client: GoogleGenAI | undefined;
const ai = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

const busy = (e: unknown) => e instanceof ApiError && (e.status === 429 || e.status === 503);

// Retry once on 429/503; any failure after that becomes GeminiUnavailableError.
async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!busy(e)) throw new GeminiUnavailableError(e);
    await new Promise((r) => setTimeout(r, RETRY_AFTER_MS));
    try {
      return await fn();
    } catch (e2) {
      throw new GeminiUnavailableError(e2);
    }
  }
}

export async function embed(texts: string[], taskType: EmbedTaskType): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await call(() =>
      ai().models.embedContent({
        model: process.env.GEMINI_EMBED_MODEL!,
        contents: batch.map((text) => ({ parts: [{ text }] })), // one Content per text: gemini-embedding-2 merges a plain string array into a single embedding
        config: { taskType, outputDimensionality: EMBED_DIMS },
      }),
    );
    const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
    if (vectors.length !== batch.length || vectors.some((v) => v.length !== EMBED_DIMS))
      throw new GeminiUnavailableError(new Error(`expected ${batch.length} x ${EMBED_DIMS} values, got ${vectors.length} x ${vectors[0]?.length}`));
    out.push(...vectors);
  }
  return out;
}

/** `files` (base64, e.g. an uploaded PDF or image) go before the prompt text in the same turn. */
export async function generateJson<S extends z.ZodType>(
  prompt: string,
  schema: S,
  files: { mimeType: string; data: string }[] = [],
): Promise<z.infer<S>> {
  const res = await call(() =>
    ai().models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: files.length ? [{ role: "user", parts: [...files.map((inlineData) => ({ inlineData })), { text: prompt }] }] : prompt,
      config: { responseMimeType: "application/json", responseJsonSchema: z.toJSONSchema(schema) },
    }),
  );
  try {
    return schema.parse(JSON.parse(res.text ?? ""));
  } catch (e) {
    throw new GeminiUnavailableError(e);
  }
}
