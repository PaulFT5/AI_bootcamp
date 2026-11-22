// Offline (D-20): embed each course's content (name + topics only, no programme/semester/ECTS/level/language)
// with GEMINI_EMBED_MODEL, taskType RETRIEVAL_DOCUMENT, 768 dims, into course.embedding.
// Run: npm run embed:courses [-- --force]   (default: only rows with embedding IS NULL)
// shortcut: idempotency is "embedding is null", so changed topics keep a stale vector until --force; track a content hash if topics change often
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { course } from "../src/db/schema";
import { embed } from "../src/llm/gemini";

const courseEmbedText = (c: { name: string; topics: string[] }) =>
  `${c.name.replace(/\s+/g, " ")}\nTopics: ${c.topics.join("; ")}`;

async function main() {
  const force = process.argv.includes("--force");
  const hasTopics = sql`jsonb_array_length(${course.topics}) > 0`;
  const rows = await db
    .select({ id: course.id, name: course.name, topics: course.topics })
    .from(course)
    .where(force ? hasTopics : and(hasTopics, isNull(course.embedding)))
    .orderBy(course.id);
  const [{ noTopics }] = (
    await db.execute<{ noTopics: number }>(sql`select count(*)::int as "noTopics" from course where jsonb_array_length(topics) = 0`)
  ).rows;
  console.log(`to embed=${rows.length} without topics (skipped)=${noTopics}`);

  // Free tier counts every text as one request (100/min for gemini-embedding-2): 50 per chunk, a pause between chunks.
  const CHUNK = 50;
  const PAUSE_MS = 35_000;
  let dims = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    if (i) await new Promise((r) => setTimeout(r, PAUSE_MS));
    const chunk = rows.slice(i, i + CHUNK);
    const vectors = await embed(chunk.map(courseEmbedText), "RETRIEVAL_DOCUMENT");
    dims = vectors[0].length;
    await db.transaction(async (tx) => {
      for (let j = 0; j < chunk.length; j++)
        await tx.update(course).set({ embedding: vectors[j] }).where(eq(course.id, chunk[j].id));
    });
    console.log(`chunk ${i / CHUNK + 1}: ${chunk.length} embedded`);
  }
  const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from course where embedding is not null`)).rows;
  console.log(`embedded=${rows.length} dims=${dims || "-"} total with embedding=${n}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? `${e.message} ${e.cause ?? ""}` : e);
    process.exit(1);
  });
