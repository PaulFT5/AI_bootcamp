// D-19 name normaliser. Kept general on purpose: not tuned to the golden set.
const STOPWORDS = new Set([
  "of", "and", "the", "in", "to", "for", "a", "an", "with", "on",
  "introduction", "fundamentals", "fundamental", "basics", "basic",
  "i", "ii", "iii", "iv",
  // catalogue noise: "Elective 4.-6. / Opțional 4.-6." prefixes
  "elective", "optional",
]);

// Common course-name abbreviations, expanded on both sides.
const SYNONYMS: Record<string, string> = {
  os: "operating systems",
  oop: "object oriented programming",
  db: "database",
  dbms: "database management systems",
  ai: "artificial intelligence",
  ml: "machine learning",
  nlp: "natural language processing",
  cv: "computer vision",
  hci: "human computer interaction",
  se: "software engineering",
  dsp: "digital signal processing",
  networking: "networks",
};

export function normaliseText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Plural "s" off, so "Systems" meets "System"; "analysis", "class", "bus" stay.
const stem = (w: string) => (w.length > 3 && /[^siu]s$/.test(w) ? w.slice(0, -1) : w);

export function nameTokens(s: string): string[] {
  return normaliseText(s)
    .split(" ")
    .flatMap((w) => (SYNONYMS[w] ?? w).split(" "))
    .filter((w) => w && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .map(stem);
}
