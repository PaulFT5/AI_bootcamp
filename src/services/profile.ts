import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { profile } from "@/db/schema";
import type { SemesterFilter } from "@/domain/semester";

export const ProfilePatch = z.object({
  semesterFilter: z.enum(["any", "winter", "summer"]).optional(),
  homeUniversity: z
    .string()
    .trim()
    .max(200)
    .transform((s) => s || null)
    .nullable()
    .optional(),
});

export type ProfileView = { semesterFilter: SemesterFilter; homeUniversity: string | null };

const view = (p: typeof profile.$inferSelect): ProfileView => ({
  semesterFilter: (["winter", "summer"] as const).find((f) => f === p.semesterFilter) ?? "any",
  homeUniversity: p.homeUniversity,
});

/** The profile row, created with defaults on first access. */
export async function getProfile(userId: string): Promise<ProfileView> {
  await db.insert(profile).values({ userId }).onConflictDoNothing();
  const [p] = await db.select().from(profile).where(eq(profile.userId, userId));
  return view(p);
}

export async function updateProfile(userId: string, patch: z.infer<typeof ProfilePatch>): Promise<ProfileView> {
  if (!Object.keys(patch).length) return getProfile(userId);
  await db.insert(profile).values({ userId }).onConflictDoNothing();
  const [p] = await db.update(profile).set(patch).where(eq(profile.userId, userId)).returning();
  return view(p);
}
