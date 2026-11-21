import { nameTokens } from "./normalise";

// shortcut: name similarity only, no semantics; add an optional LLM rerank behind a key later

const dice = <T>(a: Set<T>, b: Set<T>) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return (2 * n) / (a.size + b.size);
};

const trigrams = (tokens: string[]) => {
  const s = ` ${tokens.join(" ")} `;
  const out = new Set<string>();
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3));
  return out;
};

function scorePart(home: string[], part: string[]) {
  return 100 * (0.7 * dice(new Set(home), new Set(part)) + 0.3 * dice(trigrams(home), trigrams(part)));
}

const DESC_BONUS_PER_WORD = 5;
const DESC_BONUS_MAX = 10;

/**
 * Score one catalogue name against a home course name (0..100, plus a small description bonus).
 * Bilingual names ("Databases / Baze de date") are scored per "/" part and the best part wins,
 * so the Romanian half never dilutes an English match.
 */
export function scoreName(home: { name: string; description?: string | null }, courseName: string) {
  const homeTokens = nameTokens(home.name);
  let best = { score: 0, tokens: [] as string[] };
  for (const raw of courseName.split("/")) {
    const tokens = nameTokens(raw);
    const score = homeTokens.length ? scorePart(homeTokens, tokens) : 0;
    if (score > best.score) best = { score, tokens };
  }
  const partSet = new Set(best.tokens);
  const shared = [...new Set(homeTokens.filter((w) => partSet.has(w)))];
  const descShared = home.description
    ? [...new Set(nameTokens(home.description))].filter((w) => partSet.has(w) && !shared.includes(w))
    : [];
  const bonus = homeTokens.length ? Math.min(DESC_BONUS_MAX, DESC_BONUS_PER_WORD * descShared.length) : 0;
  return { score: best.score + bonus, shared: [...shared, ...descShared] };
}
