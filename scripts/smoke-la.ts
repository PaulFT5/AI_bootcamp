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

      // ---- Task 2: CSV (D-13), relink (D-11), print (D-14) ----
      const exportCsv = async () => {
        const res = await call("GET", "/api/la/export");
        assert.equal(res.status, 200, "GET /api/la/export");
        assert.ok(res.headers.get("content-type")?.startsWith("text/csv"), "content-type");
        assert.match(res.headers.get("content-disposition") ?? "", /filename="erasmus-upt-la-draft\.csv"/);
        const bytes = new Uint8Array(await res.arrayBuffer());
        assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], "UTF-8 BOM");
        return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).slice(1).split("\r\n");
      };
      const HEADER = "Semester,UPT code,UPT course,Faculty,Programme,Study year,ECTS,Matched home course,Home course ECTS";
      assert.deepEqual(await exportCsv(), [HEADER], "empty draft exports the header only");

      const fh = await call("POST", "/api/home-courses", { name: '=HYPERLINK("x")', ects: 7.5 });
      assert.equal(fh.status, 201);
      const formula = (await fh.json()).id as string;
      created.push(formula);
      // AC-M-81: Winter (sem 3), comma + diacritics; AC-B-12: Summer (sem 2); AC-B-3: Winter (sem 1), from the catalogue
      for (const [courseId, homeCourseId] of [["AC-B-12", formula], ["AC-M-81", formula], ["AC-B-3", null]])
        assert.equal((await call("POST", "/api/la", { courseId, homeCourseId })).status, 201, `add ${courseId}`);
      const facts = new Map(
        (await pg.query("select id, code, name, programme, study_year, ects, semester from course where id = any($1)", [["AC-B-12", "AC-M-81", "AC-B-3"]]))
          .rows.map((r) => [r.id, r]),
      );
      const q = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
      const line = (id: string, home: string) => {
        const c = facts.get(id);
        return [c.semester % 2 ? "Winter" : "Summer", c.code, q(c.name), "Automation and Computers", q(c.programme), c.study_year, c.ects, home].join(",");
      };
      const linked = `"'=HYPERLINK(""x"")",7.5`;
      const csv = await exportCsv();
      assert.equal(csv[0], HEADER, "D-13 header");
      // Winter before Summer, then by code (L002... before M028...)
      assert.deepEqual(csv.slice(1), [line("AC-B-3", ","), line("AC-M-81", linked), line("AC-B-12", linked)], "CSV rows");
      assert.ok(csv[1].includes("Algebră și geometrie"), "diacritics survive");

      const rowsNow = await list();
      assert.deepEqual(rowsNow.map((r) => r.courseId), ["AC-B-3", "AC-M-81", "AC-B-12"], "listLa order = CSV order");
      const cat = rowsNow[0];
      assert.equal(cat.homeCourseId, null, "catalogue row has no home course");

      // relink the catalogue row (D-11); a semester/season in the body is ignored (D-12 clarified)
      assert.equal((await call("PATCH", `/api/la/${cat.id}`, { homeCourseId: formula })).status, 200, "relink");
      assert.equal((await call("PATCH", `/api/la/${cat.id}`, { homeCourseId: null, semester: 2, season: "Summer" })).status, 200);
      const after = (await list()).find((r) => r.id === cat.id)!;
      assert.equal(after.season, "Winter", "PATCH must not move the course");
      assert.equal(after.homeCourseId, null);
      assert.ok((await exportCsv())[1].startsWith("Winter,"), "CSV line still Winter");
      assert.equal((await call("PATCH", `/api/la/${cat.id}`, { homeCourseId: otherHome })).status, 404, "link to other user's home course");
      assert.equal((await call("PATCH", "/api/la/not-a-uuid", { homeCourseId: null })).status, 404);

      // IDOR: another user's LA row can be neither relinked nor exported
      const { rows: ol } = await pg.query("insert into la_item (user_id, course_id) values ($1, 'AC-B-4') returning id", [other]);
      assert.equal((await call("PATCH", `/api/la/${ol[0].id}`, { homeCourseId: formula })).status, 404, "other user's PATCH");
      assert.equal((await pg.query("select home_course_id from la_item where id = $1", [ol[0].id])).rows[0].home_course_id, null);
      const mine = await exportCsv();
      assert.equal(mine.length, 4, "export holds only my 3 rows");
      assert.ok(!mine.some((l) => l.includes("L002.26.01.F3")), "other user's course exported");

      // D-14 print view
      const uniBefore = (await (await call("GET", "/api/profile")).json()).homeUniversity;
      try {
        assert.equal((await call("PATCH", "/api/profile", { homeUniversity: "Universidade do Porto" })).status, 200);
        const print = await (await call("GET", "/la/print")).text();
        const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
        for (const s of ["Test Student", "Universidade do Porto", today, "Draft only. Not signed.", "ciprian.chirila@upt.ro", "These are suggestions, not official equivalences."])
          assert.ok(print.includes(s), `/la/print lacks ${s}`);
        const pos = ["L002.26.01.F2", "M028.25.03.F2-01", facts.get("AC-B-12").code].map((c) => print.indexOf(c));
        assert.ok(pos[0] > 0 && pos[0] < pos[1] && pos[1] < pos[2], "print order = CSV order");
      } finally {
        await call("PATCH", "/api/profile", { homeUniversity: uniBefore });
      }
      const la = await (await call("GET", "/la")).text();
      for (const s of ["Back to Matcher", "No home course", "Export CSV", "Printable view"]) assert.ok(la.includes(s), `/la lacks ${s}`);
      console.log(`CSV ${csv.length - 1} rows ok; relink/IDOR ok; print ok`);
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
