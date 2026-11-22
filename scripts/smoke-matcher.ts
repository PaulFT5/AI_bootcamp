// Full Matcher smoke (01-04 Task 1): saved courses + last results (D-09), filter (D-04), edit/delete, IDOR.
// Name mode only, so no Gemini call. Needs `npm run db:up`, `npm run db:seed` and `npm run build`. Run: npm run smoke:matcher
import assert from "node:assert/strict";
import { Client } from "pg";
import { withServer } from "./lib/with-server";

type Match = { code: string; semester: number };
type Course = { id: string; name: string; last: { filter: string; matches: Match[] } | null };

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const created: string[] = [];
  const other = `smoke-other-${Date.now()}`;
  // the smoke changes the mock student's filter; put it back afterwards
  const before = (await pg.query("select semester_filter from profile where user_id = 'mock-student'")).rows[0]?.semester_filter;
  try {
    await withServer(async (base) => {
      const call = (method: string, path: string, body?: unknown) =>
        fetch(base + path, {
          method,
          headers: body === undefined ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      const addHome = async (body: unknown) => {
        const res = await call("POST", "/api/home-courses", body);
        assert.equal(res.status, 201, "POST /api/home-courses");
        const row = (await res.json()) as Course;
        assert.equal(row.last, null, "a new course has no last result");
        created.push(row.id);
        return row.id;
      };
      const match = async (homeCourseId: string, extra = {}) => {
        const res = await call("POST", "/api/matches", { homeCourseId, ...extra });
        assert.equal(res.status, 200, `POST /api/matches (${await res.clone().text()})`);
        return (await res.json()) as { mode: string; filter: string; matches: Match[] };
      };
      const list = async () => (await (await call("GET", "/api/home-courses")).json()) as Course[];

      assert.equal((await call("PATCH", "/api/profile", { semesterFilter: "any" })).status, 200);
      const net = await addHome({ name: "Computer Networks", description: "TCP/IP, routing, switching" });
      const thermo = await addHome({ name: "Thermodynamics", description: "laws of thermodynamics, entropy, heat engines" });
      const netRun = await match(net);
      await match(thermo);
      assert.equal(netRun.mode, "name");
      const firstCode = netRun.matches[0].code;

      // D-09: the result is stored and comes back without ranking again
      const { rows } = await pg.query("select match_hash from home_course where id = $1", [net]);
      assert.ok(rows[0].match_hash, "match_hash not set");
      assert.equal((await pg.query("select 1 from match_cache where hash = $1", [rows[0].match_hash])).rowCount, 1, "no cache row");
      const saved = (await list()).find((c) => c.id === net)!;
      assert.equal(saved.last?.matches[0].code, firstCode, "GET /api/home-courses last result");
      const html = await (await call("GET", "/matcher")).text();
      for (const s of ["Computer Networks", "Thermodynamics", firstCode]) assert.ok(html.includes(s), `/matcher HTML lacks ${s}`);
      assert.deepEqual((await match(net)).matches.map((m) => m.code), netRun.matches.map((m) => m.code), "cached run differs");
      assert.equal((await match(net, { force: true })).matches[0].code, firstCode, "forced run");

      // D-04: Winter filter is saved and every match afterwards has an odd semester
      const p = await call("PATCH", "/api/profile", { semesterFilter: "winter" });
      assert.equal((await p.json()).semesterFilter, "winter");
      assert.equal((await (await call("GET", "/api/profile")).json()).semesterFilter, "winter");
      for (const id of [net, thermo]) {
        const r = await match(id);
        assert.equal(r.filter, "winter");
        assert.ok(r.matches.every((m) => m.semester % 2 === 1), `even semester under Winter: ${r.matches.map((m) => m.semester)}`);
      }
      assert.equal((await call("PATCH", "/api/profile", { semesterFilter: "spring" })).status, 400, "bad filter");

      // Edit clears the last result; bad edits are refused
      const edit = await call("PATCH", `/api/home-courses/${net}`, { description: "OSI model, TCP/IP, routing" });
      assert.equal(edit.status, 200, "PATCH home course");
      assert.equal((await list()).find((c) => c.id === net)?.last, null, "edit must clear last");
      assert.equal((await call("PATCH", `/api/home-courses/${net}`, { name: " " })).status, 400, "blank name");
      assert.equal((await call("PATCH", `/api/home-courses/${net}`, { ects: 7.3 })).status, 400, "ECTS not in halves");

      // Delete
      assert.equal((await call("DELETE", `/api/home-courses/${thermo}`)).status, 204, "DELETE");
      assert.ok(!(await list()).some((c) => c.id === thermo), "deleted course still listed");
      assert.equal((await call("DELETE", `/api/home-courses/${thermo}`)).status, 404, "second DELETE");
      assert.equal((await call("PATCH", "/api/home-courses/not-a-uuid", { name: "x" })).status, 404, "non-uuid id");

      // IDOR: another user's course cannot be edited or deleted
      await pg.query("insert into \"user\" (id, name, email) values ($1, 'Other', $2)", [other, `${other}@example.test`]);
      const { rows: o } = await pg.query("insert into home_course (user_id, name) values ($1, 'Secret') returning id", [other]);
      assert.equal((await call("PATCH", `/api/home-courses/${o[0].id}`, { name: "Hacked" })).status, 404, "other user's PATCH");
      assert.equal((await call("DELETE", `/api/home-courses/${o[0].id}`)).status, 404, "other user's DELETE");
      assert.equal((await pg.query("select name from home_course where id = $1", [o[0].id])).rows[0]?.name, "Secret");
      console.log(`first match ${firstCode}; winter filter ok; edit/delete/IDOR ok`);
    });
  } finally {
    await pg.query("delete from \"user\" where id = $1", [other]); // cascades to its home_course
    if (created.length) await pg.query("delete from home_course where id = any($1)", [created]);
    await pg.query("update profile set semester_filter = $1 where user_id = 'mock-student'", [before ?? "any"]);
    await pg.end();
  }
  console.log("SMOKE MATCHER OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
