import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// One pool per process: dev hot reload would otherwise open a new pool on every edit.
const g = globalThis as unknown as { pgPool?: Pool };
const pool = (g.pgPool ??= new Pool({ connectionString: process.env.DATABASE_URL }));

export const db = drizzle(pool, { schema });
