import Link from "next/link";
import { laTotals } from "@/domain/ects";
import { requireUser } from "@/lib/session";
import { laCoordinators, listLa } from "@/services/la";
import { getProfile } from "@/services/profile";
import { PrintButton } from "./print-button";

// D-14: browser print only (no PDF library). Always says it is a draft (MATCH-08 prohibition).
export default async function LaPrintPage() {
  const user = await requireUser();
  const [rows, profile] = await Promise.all([listLa(user.id), getProfile(user.id)]);
  const coordinators = await laCoordinators(rows);
  const t = laTotals(rows);
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Bucharest",
  });

  return (
    <div className="print-doc">
      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Link className="btn btn-quiet" href="/la">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to draft
        </Link>
        <PrintButton />
      </div>
      <h1>Learning Agreement draft · Erasmus@UPT</h1>
      <p>
        <b>{user.name}</b> · {profile.homeUniversity ?? "Home university not set"} · {date}
      </p>
      <p>Erasmus Course Catalogue 2026-27</p>
      <div className="table-wrap" style={{ margin: "12px 0" }}>
        <table>
          <thead>
            <tr>
              <th>Semester</th>
              <th>UPT code</th>
              <th>UPT course</th>
              <th>Faculty</th>
              <th>Programme</th>
              <th>Study year</th>
              <th>ECTS</th>
              <th>Matched home course</th>
              <th>Home course ECTS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 28 }}>
                  Your draft is empty. Add courses from the Matcher or the Catalogue.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.season}</td>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td>{r.facultyName}</td>
                <td>{r.programme}</td>
                <td>{r.studyYear}</td>
                <td>{r.ects}</td>
                <td>{r.homeCourseName ?? ""}</td>
                <td>{r.homeCourseEcts ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <b>Winter:</b> {t.winter} ECTS · <b>Summer:</b> {t.summer} ECTS
      </p>
      <p>
        <b>
          Draft only. Not signed. These are suggestions, not official equivalences. Final approval is given by the
          Erasmus coordinator of the Faculty of Automation and Computers.
        </b>
      </p>
      {coordinators.map((f) => (
        <p key={f.code}>
          Faculty coordinator · {f.name}: {[f.coordinatorName, f.coordinatorEmail].filter(Boolean).join(" · ")} (source:{" "}
          {f.sourceUrl}, checked {f.checkedOn})
        </p>
      ))}
    </div>
  );
}
