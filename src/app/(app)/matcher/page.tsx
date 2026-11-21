import { requireUser } from "@/lib/session";

export default async function MatcherPage() {
  const user = await requireUser();
  return (
    <section className="pane">
      <h2>Your home courses</h2>
      <p className="muted">Signed in as {user.name}</p>
    </section>
  );
}
