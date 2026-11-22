// Matcher smoke (D-18: the mock student is always signed in). Topic mode makes one Gemini embed call.
// Needs `npm run db:up`, `npm run db:seed`, `npm run embed:courses` and `npm run build` first. Run: npm run smoke:match
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { withServer } from "./lib/with-server";

const OS_CODE = "L002.25.04.F4";
const BANDS = ["Strong", "Partial", "Weak"];

type Match = {
  courseId: string; code: string; band: string; reason: string; evidence: string; evidenceLabel: string;
  coveredTopics: string[]; missingTopics: string[]; ects: number; semester: number; studyYear: number;
  facultyCode: string; programme: string; languageLabel: string | null; coordinator: { email: string };
};

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const created: string[] = [];
  try {
    await withServer(async (base) => {
      const post = (path: string, body: unknown) =>
        fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const addHome = async (body: unknown) => {
        const res = await post("/api/home-courses", body);
        assert.equal(res.status, 201, "POST /api/home-courses status");
        const row = await res.json();
        created.push(row.id);
        return row.id as string;
      };
      const match = async (homeCourseId: string) => {
        const res = await post("/api/matches", { homeCourseId });
        assert.equal(res.status, 200, `POST /api/matches status (${await res.clone().text()})`);
        return (await res.json()) as { mode: string; matches: Match[] };
      };
      const checkFacts = async (matches: Match[]) => {
        assert.ok(matches.length >= 1 && matches.length <= 5, `1-5 matches, got ${matches.length}`);
        const { rows } = await pg.query("select * from course where id = any($1)", [matches.map((m) => m.courseId)]);
        const byId = new Map(rows.map((r) => [r.id, r]));
        for (const m of matches) {
          const c = byId.get(m.courseId);
          assert.ok(c, `${m.courseId} not in course table`);
          assert.deepEqual(
            [m.code, m.ects, m.semester, m.studyYear, m.facultyCode, m.programme, m.languageLabel],
            [c.code, c.ects, c.semester, c.study_year, c.faculty_code, c.programme, c.language_label],
            `${m.courseId} facts differ from the DB row`,
          );
          assert.ok(BANDS.includes(m.band), `band ${m.band}`);
          assert.ok(m.reason.length > 0, "empty reason");
          assert.ok(m.coordinator.email, "coordinator email missing");
          assert.ok(!m.coveredTopics.some((t) => m.missingTopics.includes(t)), "topic in both lists");
        }
      };
      const top3 = (ms: Match[]) => ms.slice(0, 3).map((m) => m.code);

      // Mode 1: name search
      const byName = await match(
        await addHome({
          name: "Operating Systems",
          description: "processes and threads, CPU scheduling, memory management, file systems, synchronisation",
        }),
      );
      assert.equal(byName.mode, "name");
      await checkFacts(byName.matches);
      for (const m of byName.matches) {
        assert.equal(m.evidenceLabel, "Compared by catalogue entry");
        assert.deepEqual([m.coveredTopics, m.missingTopics], [[], []], "name mode has no topic lists");
      }
      assert.ok(top3(byName.matches).includes(OS_CODE), `name mode top 3: ${top3(byName.matches)}`);
      console.log(`name mode: ${byName.matches.length} matches, top 3 ${top3(byName.matches).join(", ")}`);

      // Mode 2: topic search
      const byTopics = await match(
        await addHome({
          name: "OS",
          topics: ["processes and threads", "CPU scheduling", "memory management", "file systems"],
          source: "syllabus",
        }),
      );
      assert.equal(byTopics.mode, "topics");
      await checkFacts(byTopics.matches);
      for (const m of byTopics.matches) assert.equal(m.evidenceLabel, "Topics inferred from course name");
      assert.ok(top3(byTopics.matches).includes(OS_CODE), `topic mode top 3: ${top3(byTopics.matches)}`);
      const os = byTopics.matches.find((m) => m.code === OS_CODE)!;
      assert.ok(os.coveredTopics.length > 0, "Operating Systems covers none of the home topics");
      console.log(`topic mode: ${byTopics.matches.length} matches, top 3 ${top3(byTopics.matches).join(", ")}, OS covers ${os.coveredTopics.join("; ")}`);

      // Validation and access
      assert.equal((await post("/api/home-courses", { name: "   " })).status, 400, "whitespace name");
      assert.equal((await post("/api/home-courses", {})).status, 400, "missing name");
      assert.equal((await post("/api/matches", { homeCourseId: "nope" })).status, 400, "non-uuid id");
      assert.equal((await post("/api/matches", { homeCourseId: randomUUID() })).status, 404, "unknown id");

      // IDOR: another user's home course is invisible to the mock student
      const other = `smoke-other-${Date.now()}`;
      await pg.query("insert into \"user\" (id, name, email) values ($1, 'Other', $2)", [other, `${other}@example.test`]);
      try {
        const { rows } = await pg.query("insert into home_course (user_id, name) values ($1, 'Operating Systems') returning id", [other]);
        assert.equal((await post("/api/matches", { homeCourseId: rows[0].id })).status, 404, "other user's home course");
      } finally {
        await pg.query("delete from \"user\" where id = $1", [other]); // cascades to its home_course
      }
    });
  } finally {
    if (created.length) await pg.query("delete from home_course where id = any($1)", [created]);
    await pg.end();
  }
  console.log("SMOKE MATCH OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
