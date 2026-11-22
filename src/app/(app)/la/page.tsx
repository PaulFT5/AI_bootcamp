import { requireUser } from "@/lib/session";
import { listHomeCourses } from "@/services/home-courses";
import { listLa } from "@/services/la";
import { getProfile } from "@/services/profile";
import { LaTable } from "./la-table";

// MATCH-08: reached only from the Matcher's "Open full draft" (no nav item).
export default async function LaPage() {
  const user = await requireUser();
  const [rows, homes, profile] = await Promise.all([listLa(user.id), listHomeCourses(user.id), getProfile(user.id)]);
  return (
    <LaTable
      initialRows={rows}
      homeCourses={homes.map((h) => ({ id: h.id, name: h.name }))}
      initialHomeUniversity={profile.homeUniversity ?? ""}
    />
  );
}
