import { TopBar } from "@/components/top-bar";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="app">
      <TopBar name={user.name} email={user.email} />
      <div className="content">
        <div className="data-note">Erasmus Course Catalogue 2026-27 · Automation and Computers</div>
        <main>{children}</main>
      </div>
    </div>
  );
}
