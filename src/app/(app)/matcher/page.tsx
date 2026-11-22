import { requireUser } from "@/lib/session";
import { listHomeCourses } from "@/services/home-courses";
import { listLa } from "@/services/la";
import { getProfile } from "@/services/profile";
import { MatcherView } from "./matcher-view";

// D-09: saved courses and their last results are in the first paint; nothing is ranked again here.
export default async function MatcherPage() {
  const user = await requireUser();
  const [courses, profile, la] = await Promise.all([listHomeCourses(user.id), getProfile(user.id), listLa(user.id)]);
  return <MatcherView initialCourses={courses} initialFilter={profile.semesterFilter} initialLa={la} />;
}
