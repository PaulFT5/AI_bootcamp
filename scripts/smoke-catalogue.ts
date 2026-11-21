// Catalogue browser smoke (D-18: no auth, the mock student is always signed in).
// Needs `npm run db:up`, `npm run db:seed` and `npm run build` first. Run: npm run smoke:catalogue
import assert from "node:assert/strict";
import { Client } from "pg";
import { withServer } from "./lib/with-server";

const rowsIn = (html: string) => html.split("data-course-id=").length - 1;

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const dbCount = async (where: string) =>
    (await pg.query(`select count(*)::int as n from course where ${where}`)).rows[0].n as number;
  try {
    await withServer(async (base) => {
      const get = async (qs = "") => {
        const res = await fetch(`${base}/catalogue${qs}`);
        assert.equal(res.status, 200, `GET /catalogue${qs} status`);
        return res.text();
      };

      const all = await get();
      assert.ok(all.includes("Erasmus Course Catalogue 2026-27"), "source year label missing");
      assert.equal(rowsIn(all), 204, "no query -> 204 rows");
      assert.equal(
        all.split(">Listed language:").length - 1, // ">" skips the copy in the RSC payload
        await dbCount("language_label is not null"),
        "'Listed language:' count differs from courses with a language",
      );
      assert.ok(all.includes("Automation and Computers courses only for now"), "D-17 scope line missing");

      const filters: [string, string][] = [
        ["?semester=winter", "semester % 2 = 1"],
        ["?semester=summer", "semester % 2 = 0"],
        ["?ects=7", "ects = 7"],
        ["?syllabus=1", "has_syllabus"],
        ["?faculty=CT", "true"], // unknown parameter ignored, there is no faculty filter
        ["?semester=summer&ects=7", "semester % 2 = 0 and ects = 7"],
      ];
      for (const [qs, where] of filters) assert.equal(rowsIn(await get(qs)), await dbCount(where), `${qs} row count`);

      const search = await get("?q=L002.25.04.F4");
      assert.ok(search.includes("Operating Systems"), "?q=L002.25.04.F4 does not find Operating Systems");
      assert.equal(rowsIn(search), 1, "?q=L002.25.04.F4 row count");
    });
  } finally {
    await pg.end();
  }
  console.log("SMOKE CATALOGUE OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
