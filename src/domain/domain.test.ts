import { describe, expect, it } from "vitest";
import { cleanScore, similarityToScore, toBand } from "./bands";
import { finaliseMatches, topicOverlap } from "./matches";
import { scoreName } from "./name-match";
import { nameTokens, normaliseText } from "./normalise";
import { matchesFilter, season } from "./semester";

describe("bands", () => {
  it("bands at the 70/40 boundaries", () => {
    expect(toBand(70)).toBe("Strong");
    expect(toBand(69)).toBe("Partial");
    expect(toBand(40)).toBe("Partial");
    expect(toBand(39)).toBe("Weak");
  });
  it("clamps, rounds and rejects non-finite scores", () => {
    expect(cleanScore(69.5)).toBe(70);
    expect(cleanScore(39.4)).toBe(39);
    expect(cleanScore(-5)).toBe(0);
    expect(cleanScore(140)).toBe(100);
    expect(cleanScore(NaN)).toBeNull();
    expect(cleanScore(Infinity)).toBeNull();
  });
  it("maps cosine similarity onto 0..100 monotonically", () => {
    expect(similarityToScore(0)).toBe(0);
    expect(similarityToScore(1)).toBe(100);
    expect(similarityToScore(0.7)).toBeGreaterThan(similarityToScore(0.6));
  });
});

describe("semester", () => {
  it("odd is Winter, even is Summer", () => {
    expect(season(1)).toBe("Winter");
    expect(season(9)).toBe("Winter");
    expect(season(2)).toBe("Summer");
    expect(season(10)).toBe("Summer");
  });
  it("filters by parity", () => {
    expect(matchesFilter(3, "winter")).toBe(true);
    expect(matchesFilter(3, "summer")).toBe(false);
    expect(matchesFilter(4, "any")).toBe(true);
  });
});

describe("normalise", () => {
  it("folds case, whitespace, diacritics and NFC/NFD", () => {
    expect(normaliseText("  Baze de  DATE ")).toBe("baze de date");
    expect(normaliseText("Bază de date".normalize("NFD"))).toBe(normaliseText("Baza de date"));
    expect(normaliseText("Bază")).toBe("baza");
  });
  it("drops stopwords and numbering, strips plurals, expands abbreviations", () => {
    expect(nameTokens("Introduction to the Operating Systems II")).toEqual(["operating", "system"]);
    expect(nameTokens("OS")).toEqual(["operating", "system"]);
    expect(nameTokens("Object-Oriented Programming")).toEqual(["object", "oriented", "programming"]);
    expect(nameTokens("Elective 4.-6. / Opțional 4.-6.")).toEqual([]);
    expect(nameTokens("Analysis")).toEqual(["analysis"]);
  });
});

describe("scoreName", () => {
  it("an identical English half scores 100 even with a Romanian half", () => {
    const r = scoreName({ name: "Databases" }, "Databases / Baze de date");
    expect(r.score).toBe(100);
    expect(r.shared).toEqual(["database"]);
  });
  it("ignores elective prefixes in catalogue names", () => {
    const r = scoreName({ name: "Natural Language Processing" }, "Elective 4.-6. / Opțional 4.-6. Natural Language Processing / Procesarea Limbajului Natural");
    expect(r.score).toBe(100);
  });
  it("ranks a closer name higher and unrelated names low", () => {
    const os = scoreName({ name: "Operating Systems" }, "Operating Systems / Sisteme de operare").score;
    const iot = scoreName({ name: "Operating Systems" }, "Elective 7.-9. / Opțional 7.-9. Operating Systems for IoT / Sisteme de Operare pentru IoT").score;
    const art = scoreName({ name: "Operating Systems" }, "2D Art in Games / Artă 2D în jocuri").score;
    expect(os).toBeGreaterThan(iot);
    expect(iot).toBeGreaterThan(art);
    expect(art).toBeLessThan(40);
  });
  it("gives a small bonus when the description shares words with the course name", () => {
    const plain = scoreName({ name: "Systems" }, "Embedded Systems").score;
    const withDesc = scoreName({ name: "Systems", description: "embedded microcontrollers" }, "Embedded Systems");
    expect(withDesc.score).toBeGreaterThan(plain);
    expect(withDesc.score - plain).toBeLessThanOrEqual(10);
    expect(withDesc.shared).toContain("embedded");
  });
  it("a name made only of stopwords scores 0", () => {
    expect(scoreName({ name: "Introduction" }, "Introduction to Game Design").score).toBe(0);
  });
});

describe("finaliseMatches", () => {
  const m = (id: string, score: number, covered: string[] = [], missing: string[] = []) => ({
    id,
    score,
    reason: " r ",
    coveredTopics: covered,
    missingTopics: missing,
  });
  it("dedupes keeping the first, drops non-finite, sorts by score then id, keeps 5", () => {
    const out = finaliseMatches([m("b", 50), m("a", 50), m("b", 90), m("x", NaN), m("c", 80), m("d", 10), m("e", 20), m("f", 30)]);
    expect(out.map((r) => r.id)).toEqual(["c", "a", "b", "f", "e"]);
    expect(out[0]).toMatchObject({ band: "Strong", reason: "r" });
  });
  it("never lists a topic as both covered and missing", () => {
    const [r] = finaliseMatches([m("a", 50, ["SQL"], ["sql", "joins"])]);
    expect(r.missingTopics).toEqual(["joins"]);
  });
  it("returns an empty list for no input", () => {
    expect(finaliseMatches([])).toEqual([]);
  });
});

describe("topicOverlap", () => {
  it("splits home topics into covered and missing by word overlap", () => {
    const r = topicOverlap(
      ["CPU scheduling", "memory management", "quantum entanglement"],
      ["Process scheduling algorithms", "Virtual memory and paging", "Memory management"],
    );
    expect(r.covered).toEqual(["CPU scheduling", "memory management"]);
    expect(r.missing).toEqual(["quantum entanglement"]);
  });
});
