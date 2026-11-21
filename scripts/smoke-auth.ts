// D-18 walking-skeleton smoke: landing -> mock student on the Matcher, idempotent seed, data survives a restart.
// Needs `npm run db:up` and `npm run build` first. Run: npx tsx --env-file=.env.local scripts/smoke-auth.ts
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { Client } from "pg";
import { MOCK_USER } from "../src/db/schema";
import { withServer } from "./lib/with-server";

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  try {
    // db:push twice -> still exactly one mock user
    for (let i = 0; i < 2; i++) {
      const r = spawnSync("npm run db:push", { shell: true, stdio: "ignore" });
      assert.equal(r.status, 0, "npm run db:push failed");
    }
    const { rows } = await pg.query(`select count(*)::int as n from "user" where id = $1`, [MOCK_USER.id]);
    assert.equal(rows[0].n, 1, "expected exactly one mock user row");

    const marker = `Smoke University ${Date.now()}`;
    await withServer(async (base) => {
      const home = await fetch(base + "/");
      assert.equal(home.status, 200, "GET / status");
      const html = await home.text();
      assert.match(html, /<a[^>]*href="\/matcher"[^>]*>Log in<\/a>/, "landing has no Log in link to /matcher");

      const matcher = await fetch(base + "/matcher", { redirect: "manual" });
      assert.equal(matcher.status, 200, "GET /matcher status");
      assert.ok((await matcher.text()).includes(MOCK_USER.name), "Matcher does not greet the mock student");

      await pg.query(
        `insert into profile (user_id, home_university) values ($1, $2)
         on conflict (user_id) do update set home_university = excluded.home_university`,
        [MOCK_USER.id, marker],
      );
    });

    // restart the server: the row written for the mock user is still there and the app still serves them
    await withServer(async (base) => {
      const matcher = await fetch(base + "/matcher", { redirect: "manual" });
      assert.equal(matcher.status, 200, "GET /matcher after restart");
      const { rows } = await pg.query(`select home_university from profile where user_id = $1`, [MOCK_USER.id]);
      assert.equal(rows[0]?.home_university, marker, "profile row lost across restart");
    });
  } finally {
    await pg.end();
  }
  console.log("SMOKE AUTH OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
