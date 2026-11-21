export type Band = "Strong" | "Partial" | "Weak";

// D-06 thresholds (Claude's discretion), checked against the golden set.
export const BAND_THRESHOLDS = { strong: 70, partial: 40 } as const;

export function cleanScore(raw: number): number | null {
  if (!Number.isFinite(raw)) return null;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export const toBand = (score: number): Band =>
  score >= BAND_THRESHOLDS.strong ? "Strong" : score >= BAND_THRESHOLDS.partial ? "Partial" : "Weak";

// Cosine similarity (topic mode) -> 0..100, linear between SIM_FLOOR (score 0) and SIM_CEIL (score 100).
// Calibrated on the golden run (01-03-SUMMARY.md): expected matches 0.81-0.88, related neighbours 0.72-0.82,
// unrelated best 0.68-0.69, so Strong starts near 0.80, Partial near 0.72 and unrelated courses stay Weak.
export const SIM_FLOOR = 0.62;
export const SIM_CEIL = 0.88;
export const similarityToScore = (sim: number) =>
  Math.min(100, Math.max(0, ((sim - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR)) * 100));
