import { createHash } from "node:crypto";
import { and, asc, cosineDistance, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { course, faculty, homeCourse, matchCache, type HomeCourse } from "@/db/schema";
import { similarityToScore } from "@/domain/bands";
import { finaliseMatches, MAX_MATCHES, topicOverlap, type RankedMatch } from "@/domain/matches";
import { scoreName } from "@/domain/name-match";
import { season, type Season, type SemesterFilter } from "@/domain/semester";
import { embed } from "@/llm/gemini";
import { getProfile } from "@/services/profile";

export type HomeCourseInput = {
  name: string;
  description?: string | null;
  topics: string[];
  ects?: number | null;
  studyYear?: number | null;
};
export type MatchMode = "name" | "topics";
export type Evidence = "syllabus" | "inferred" | "catalogue";

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  syllabus: "Compared with UPT syllabus",
  inferred: "Topics inferred from course name",
  catalogue: "Compared by catalogue entry",
};

export type MatchView = RankedMatch & {
  courseId: string;
  code: string;
  name: string;
  facultyCode: string;
  facultyName: string;
  programme: string;
  level: string;
  studyYear: number;
  semester: number;
  season: Season;
  ects: number;
  languageLabel: string | null;
  hasSyllabus: boolean;
  evidence: Evidence;
  evidenceLabel: string;
  coordinator: { name: string | null; email: string; sourceUrl: string };
};

export class NotFoundError extends Error {}

// D-04 parity as an exact SQL filter
const inFilter = (filter: SemesterFilter) =>
  filter === "any" ? undefined : sql`${course.semester} % 2 = ${filter === "winter" ? 1 : 0}`;

const list = (xs: string[], max = 4) => xs.slice(0, max).join(", ") + (xs.length > max ? ` +${xs.length - max} more` : "");

/** Mode 1 (D-19): deterministic name similarity over the AC catalogue, no AI. */
export async function matchByName(input: HomeCourseInput, filter: SemesterFilter): Promise<RankedMatch[]> {
  const rows = await db
    .select({ id: course.id, name: course.name, semester: course.semester, ects: course.ects })
    .from(course)
    .where(inFilter(filter));
  const raw = rows.map((c) => {
    const { score, shared } = scoreName(input, c.name);
    const parts = [
      shared.length ? `Shares: ${list(shared, 6)}` : "No shared words, similar spelling only",
      `${season(c.semester)} (sem ${c.semester})`,
      ...(input.ects ? [`${input.ects} vs ${c.ects} ECTS`] : []),
    ];
    return { id: c.id, score, reason: parts.join(" · "), coveredTopics: [], missingTopics: [] };
  });
  return finaliseMatches(raw.filter((m) => m.score > 0));
}

/** Mode 2 (D-20): embed the home topics, nearest UPT courses by cosine distance in pgvector. */
export async function matchByTopics(topics: string[], filter: SemesterFilter): Promise<RankedMatch[]> {
  const [q] = await embed([topics.join("; ")], "RETRIEVAL_QUERY");
  const distance = cosineDistance(course.embedding, q);
  const rows = await db
    .select({ id: course.id, topics: course.topics, distance })
    .from(course)
    .where(and(isNotNull(course.embedding), inFilter(filter)))
    .orderBy(distance, asc(course.id))
    .limit(MAX_MATCHES);
  return finaliseMatches(
    rows.map((r) => {
      const { covered, missing } = topicOverlap(topics, r.topics);
      const parts = [
        covered.length ? `Both cover: ${list(covered)}` : "No listed topic in common",
        ...(missing.length ? [`Not at UPT: ${list(missing)}`] : []),
      ];
      return {
        id: r.id,
        score: similarityToScore(1 - Number(r.distance)),
        reason: parts.join(" · "),
        coveredTopics: covered,
        missingTopics: missing,
      };
    }),
  );
}

/** Every fact, the evidence label and the coordinator come from the course + faculty rows, never from the ranker. */
export async function enrichMatches(ranked: RankedMatch[], mode: MatchMode): Promise<MatchView[]> {
  if (!ranked.length) return [];
  const rows = await db
    .select({
      id: course.id,
      code: course.code,
      name: course.name,
      facultyCode: course.facultyCode,
      facultyName: faculty.name,
      programme: course.programme,
      level: course.level,
      studyYear: course.studyYear,
      semester: course.semester,
      ects: course.ects,
      languageLabel: course.languageLabel,
      hasSyllabus: course.hasSyllabus,
      topicsSource: course.topicsSource,
      coordinatorName: faculty.coordinatorName,
      coordinatorEmail: faculty.coordinatorEmail,
      sourceUrl: faculty.sourceUrl,
    })
    .from(course)
    .innerJoin(faculty, eq(course.facultyCode, faculty.code))
    .where(inArray(course.id, ranked.map((m) => m.id)));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ranked.flatMap((m) => {
    const c = byId.get(m.id);
    if (!c) return [];
    const evidence: Evidence = mode === "name" ? "catalogue" : c.topicsSource === "syllabus" ? "syllabus" : "inferred";
    return [
      {
        ...m,
        courseId: c.id,
        code: c.code,
        name: c.name,
        facultyCode: c.facultyCode,
        facultyName: c.facultyName,
        programme: c.programme,
        level: c.level,
        studyYear: c.studyYear,
        semester: c.semester,
        season: season(c.semester),
        ects: c.ects,
        languageLabel: c.languageLabel,
        hasSyllabus: c.hasSyllabus,
        evidence,
        evidenceLabel: EVIDENCE_LABEL[evidence],
        coordinator: { name: c.coordinatorName, email: c.coordinatorEmail, sourceUrl: c.sourceUrl },
      },
    ];
  });
}

// D-08/D-09 cache: bump when ranking logic changes so old cached results are recomputed.
// shortcut: entries are never evicted or invalidated on reseed; truncate match_cache after changing course data
const CACHE_VERSION = 1;
type CachedResult = { filter: SemesterFilter; mode: MatchMode; ranked: RankedMatch[] };

// Ranked ids and scores depend only on these fields; facts are re-read from the DB on every view.
const matchHash = (h: HomeCourse, mode: MatchMode, filter: SemesterFilter) =>
  createHash("sha256")
    .update(JSON.stringify([CACHE_VERSION, mode, filter, h.name, h.description, h.topics, h.ects]))
    .digest("hex");

const readCache = async (hash: string) =>
  (await db.select({ result: matchCache.result }).from(matchCache).where(eq(matchCache.hash, hash)))[0]
    ?.result as CachedResult | undefined;

/** D-09: the course's last result without ranking again; null when never matched, edited since, or stale. */
export async function lastMatchesFor(h: HomeCourse) {
  if (!h.matchHash) return null;
  const r = await readCache(h.matchHash);
  // a run that finished after an edit stored the old content's hash: treat it as no result
  if (!r || matchHash(h, r.mode, r.filter) !== h.matchHash) return null;
  return { filter: r.filter, mode: r.mode, matches: await enrichMatches(r.ranked, r.mode) };
}

/**
 * Topic mode when the home course has topics (uploaded syllabus or typed topics), otherwise name mode.
 * `byName` forces name mode (D-20 fallback when Gemini is down); `force` skips the cache read (D-09 "Re-run matching").
 */
export async function matchHomeCourse(
  userId: string,
  homeCourseId: string,
  opts: { force?: boolean; byName?: boolean } = {},
) {
  const [h] = await db
    .select()
    .from(homeCourse)
    .where(and(eq(homeCourse.id, homeCourseId), eq(homeCourse.userId, userId)));
  if (!h) throw new NotFoundError("home course not found");
  const { semesterFilter: filter } = await getProfile(userId);
  const mode: MatchMode = h.topics.length && !opts.byName ? "topics" : "name";
  const hash = matchHash(h, mode, filter);
  let ranked = opts.force ? undefined : (await readCache(hash))?.ranked;
  if (!ranked) {
    ranked = mode === "topics" ? await matchByTopics(h.topics, filter) : await matchByName(h, filter);
    const result: CachedResult = { filter, mode, ranked };
    await db
      .insert(matchCache)
      .values({
        hash,
        result,
        model: mode === "topics" ? (process.env.GEMINI_EMBED_MODEL ?? "embed") : "name",
        promptVersion: String(CACHE_VERSION),
      })
      .onConflictDoUpdate({ target: matchCache.hash, set: { result, createdAt: new Date() } });
  }
  await db.update(homeCourse).set({ matchHash: hash }).where(eq(homeCourse.id, h.id));
  return { homeCourseId: h.id, filter, mode, matches: await enrichMatches(ranked, mode) };
}
