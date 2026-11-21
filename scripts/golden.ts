// AC golden-set gate (01-03 Task 2). Calls the matcher services directly: no server, no user.
// Run: npm run golden [-- --topics] [-- --limit N]
//   default: name mode (D-19).  --topics: topic mode (D-20), topics = description split on , ; and "and".
import { readFileSync } from "node:fs";
import { enrichMatches, matchByName, matchByTopics } from "../src/services/matcher";
import type { SemesterFilter } from "../src/domain/semester";

type Case = {
  label: string;
  home: { name: string; description: string };
  expectCodesTop3: string[];
  filter?: SemesterFilter;
  negative?: true;
};

// Pass thresholds out of 12 positive cases. Name mode: what name similarity realistically reaches (D-19), see 01-03-SUMMARY.md.
const PASS_MIN = { name: 10, topics: 9 } as const;
const PAUSE_MS = 1000; // topic mode: gentle on the free-tier embed quota

const args = process.argv.slice(2);
const mode = args.includes("--topics") ? "topics" : "name";
const limitAt = args.indexOf("--limit");
const all: Case[] = JSON.parse(readFileSync("data/golden/golden-set.json", "utf8"));
const cases = limitAt >= 0 ? all.slice(0, Number(args[limitAt + 1])) : all;

const splitTopics = (s: string) =>
  s
    .split(/[,;]|\band\b/i)
    .map((t) => t.trim().replace(/\.$/, ""))
    .filter(Boolean);

async function main() {
  let passed = 0;
  let positives = 0;
  let negativeOk = true;
  for (const [i, c] of cases.entries()) {
    if (mode === "topics" && i) await new Promise((r) => setTimeout(r, PAUSE_MS));
    const filter = c.filter ?? "any";
    const ranked =
      mode === "topics"
        ? await matchByTopics(splitTopics(c.home.description), filter)
        : await matchByName({ ...c.home, topics: [] }, filter);
    const matches = await enrichMatches(ranked, mode);
    const top3 = matches.slice(0, 3);
    const ok = c.negative
      ? matches.every((m) => m.band !== "Strong")
      : top3.some((m) => c.expectCodesTop3.includes(m.code));
    if (c.negative) negativeOk &&= ok;
    else {
      positives++;
      if (ok) passed++;
    }
    console.log(`\n${c.label}  [${ok ? "PASS" : "FAIL"}]${c.negative ? "" : `  expect ${c.expectCodesTop3.join(" or ")}`}`);
    for (const m of top3) console.log(`  ${m.code} | ${m.name.replace(/\s+/g, " ")} | ${m.band} | ${m.score} | ${m.reason}`);
  }
  console.log(`\nmode=${mode} pass threshold=${PASS_MIN[mode]}`);
  console.log(`GOLDEN ${passed}/${positives} negative=${negativeOk ? "PASS" : "FAIL"}`);
  const full = limitAt < 0;
  process.exit(!full || (passed >= PASS_MIN[mode] && negativeOk) ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? `${e.message} ${e.cause ?? ""}` : e);
  process.exit(1);
});
