import { DataNote } from "@/components/data-note";
import { TopBar } from "@/components/top-bar";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="app">
      <TopBar name={user.name} email={user.email} />
      <div className="content">
        <DataNote />
        <main>{children}</main>
      </div>
    </div>
  );
}
