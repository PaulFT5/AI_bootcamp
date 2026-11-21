// Runs before and after `drizzle-kit push` (see npm run db:push):
// before: the vector extension must exist for the course.embedding column (Drizzle does not create extensions);
// after: seed the D-18 mock student once the user table exists. Both steps are idempotent.
import { Client } from "pg";
import { MOCK_USER } from "../src/db/schema";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    const { rows } = await client.query(`select to_regclass('public."user"') as t`);
    if (!rows[0].t) return console.log("db-init: vector extension ok (user table not pushed yet)");
    await client.query(`insert into "user" (id, name, email) values ($1, $2, $3) on conflict (id) do nothing`, [
      MOCK_USER.id,
      MOCK_USER.name,
      MOCK_USER.email,
    ]);
    console.log(`db-init: vector extension ok, mock user ${MOCK_USER.id} ok`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
