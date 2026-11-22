// LA draft smoke (01-05): add/remove/link (D-11), catalogue-locked semester (D-12), IDOR.
// Works on the shared mock student (D-18): its LA rows are set aside first and restored at the end.
// Name mode only, so no Gemini call. Needs `npm run db:up`, `npm run db:seed` and `npm run build`. Run: npm run smoke:la
import assert from "node:assert/strict";
import { Client } from "pg";
import { withServer } from "./lib/with-server";

const ME = "mock-student";
type LaRow = { id: string; courseId: string; code: string; semester: number; season: string; homeCourseId: string | null };

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const created: string[] = [];
  const other = `smoke-other-${Date.now()}`;
  const saved = (await pg.query("select course_id, home_course_id, added_at from la_item where user_id = $1", [ME])).rows;
  await pg.query("delete from la_item where user_id = $1", [ME]);
  try {
    await withServer(async (base) => {
      const call = (method: string, path: string, body?: unknown) =>
        fetch(base + path, {
          method,
          headers: body === undefined ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      const list = async () => (await (await call("GET", "/api/la")).json()) as LaRow[];

      // a home course and its (name-mode) matches
      const hc = await call("POST", "/api/home-courses", { name: "Computer Networks" });
      assert.equal(hc.status, 201, "POST /api/home-courses");
      const home = (await hc.json()).id as string;
      created.push(home);
      const run = await call("POST", "/api/matches", { homeCourseId: home });
      assert.equal(run.status, 200, "POST /api/matches");
      const first = ((await run.json()).matches as { courseId: string; code: string }[])[0];

      // add from the Matcher, linked to the home course (D-11); a second add keeps one row
      assert.equal((await call("POST", "/api/la", { courseId: first.courseId, homeCourseId: home })).status, 201, "add");
      assert.equal((await call("POST", "/api/la", { courseId: first.courseId, homeCourseId: home })).status, 200, "re-add");
      const rows = await list();
      assert.equal(rows.length, 1, "duplicate add must keep one row");
      assert.equal(rows[0].homeCourseId, home, "linked to the active home course");
      assert.equal((await call("POST", "/api/la", { courseId: "NOPE-1", homeCourseId: null })).status, 404, "unknown course");

      // IDOR: another user's home course cannot be linked
      await pg.query('insert into "user" (id, name, email) values ($1, \'Other\', $2)', [other, `${other}@example.test`]);
      const { rows: o } = await pg.query("insert into home_course (user_id, name) values ($1, 'Secret') returning id", [other]);
      const otherHome = o[0].id as string;
      assert.equal((await call("POST", "/api/la", { courseId: first.courseId, homeCourseId: otherHome })).status, 404, "other user's home course");

      const html = await (await call("GET", "/matcher")).text();
      for (const s of ["Open full draft", first.code]) assert.ok(html.includes(s), `/matcher HTML lacks ${s}`);

      assert.equal((await call("DELETE", `/api/la?courseId=${encodeURIComponent(first.courseId)}`)).status, 204, "remove");
      assert.equal((await list()).length, 0, "draft empty after remove");

      // D-12 clarified: semester/season in the body are ignored; placement comes from the catalogue row
      const odd = (await pg.query("select id from course where semester = 1 order by id limit 1")).rows[0].id as string;
      assert.equal((await call("POST", "/api/la", { courseId: odd, homeCourseId: null, semester: 2, season: "Summer" })).status, 201);
      const locked = (await list()).find((r) => r.courseId === odd);
      assert.equal(locked?.season, "Winter", "season must come from the catalogue");
      assert.equal(locked?.semester, 1);
      const cols = await pg.query(
        "select count(*)::int n from information_schema.columns where table_name = 'la_item' and column_name in ('semester','season')",
      );
      assert.equal(cols.rows[0].n, 0, "la_item must not store a semester");
      assert.equal((await call("DELETE", `/api/la?courseId=${encodeURIComponent(odd)}`)).status, 204);
      console.log(`added ${first.code}; duplicate/IDOR/remove ok; ${odd} posted as Summer stays Winter`);
    });
  } finally {
    await pg.query("delete from la_item where user_id = $1", [ME]);
    for (const r of saved)
      await pg.query("insert into la_item (user_id, course_id, home_course_id, added_at) values ($1, $2, $3, $4)", [
        ME,
        r.course_id,
        r.home_course_id,
        r.added_at,
      ]);
    await pg.query('delete from "user" where id = $1', [other]); // cascades to its home_course
    if (created.length) await pg.query("delete from home_course where id = any($1)", [created]);
    await pg.end();
  }
  console.log("SMOKE LA OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
