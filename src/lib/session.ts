import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db/client";
import { MOCK_USER, user, type User } from "@/db/schema";

// shortcut: single shared mock account, every visitor shares the same data; add real auth before public user testing
export async function requireUser(): Promise<User> {
  await connection(); // per-request render: never prerender user data at build time
  const [row] = await db.select().from(user).where(eq(user.id, MOCK_USER.id));
  if (row) return row;
  const [created] = await db.insert(user).values(MOCK_USER).onConflictDoNothing().returning();
  return created ?? (await db.select().from(user).where(eq(user.id, MOCK_USER.id)))[0];
}

// Route handlers call this; with the mock account it never returns null (no 401 path yet).
export const getSessionUser = requireUser;
