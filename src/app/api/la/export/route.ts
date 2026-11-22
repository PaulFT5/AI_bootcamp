import { toCsv } from "@/domain/csv";
import { getSessionUser } from "@/lib/session";
import { laCsvRows } from "@/services/la";

export async function GET() {
  const user = await getSessionUser();
  return new Response(toCsv(await laCsvRows(user.id)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="erasmus-upt-la-draft.csv"', // the name says "draft" (MATCH-08)
      "Cache-Control": "no-store",
    },
  });
}
