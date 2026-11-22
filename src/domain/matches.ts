import { cleanScore, toBand, type Band } from "./bands";
import { nameTokens } from "./normalise";

export type RawMatch = { id: string; score: number; reason: string; coveredTopics: string[]; missingTopics: string[] };
export type RankedMatch = RawMatch & { band: Band };

export const MAX_MATCHES = 5;

/** Dedupe (first wins), drop non-finite scores, band, sort by score desc then id asc, keep the top 5. */
export function finaliseMatches(raw: RawMatch[]): RankedMatch[] {
  const seen = new Set<string>();
  const out: RankedMatch[] = [];
  for (const m of raw) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    const score = cleanScore(m.score);
    if (score === null) continue;
    const covered = new Set(m.coveredTopics.map((t) => t.toLowerCase()));
    out.push({
      ...m,
      score,
      band: toBand(score),
      reason: m.reason.trim(),
      missingTopics: m.missingTopics.filter((t) => !covered.has(t.toLowerCase())),
    });
  }
  return out.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, MAX_MATCHES);
}

/** A home topic counts as covered when at least half of its words appear in the course's topics. */
export function topicOverlap(homeTopics: string[], courseTopics: string[]) {
  const courseWords = new Set(courseTopics.flatMap(nameTokens));
  const covered: string[] = [];
  const missing: string[] = [];
  for (const t of homeTopics) {
    const words = nameTokens(t);
    const hits = words.filter((w) => courseWords.has(w)).length;
    (words.length && hits / words.length >= 0.5 ? covered : missing).push(t);
  }
  return { covered, missing };
}
