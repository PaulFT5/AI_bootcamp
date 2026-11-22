"use client";

import Link from "next/link";
import { useState } from "react";
import { FacultyDot } from "@/components/faculty-dot";
import { laTotals } from "@/domain/ects";
import type { LaRow } from "@/services/la";

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);

// Full draft (MATCH-08). Semester is read-only text from the catalogue (D-12); only the home-course link can change (D-11).
export function LaTable({
  initialRows,
  homeCourses,
  initialHomeUniversity,
}: {
  initialRows: LaRow[];
  homeCourses: { id: string; name: string }[];
  initialHomeUniversity: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [uni, setUni] = useState(initialHomeUniversity);
  const [uniState, setUniState] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const t = laTotals(rows);

  async function saveUni(e: React.FormEvent) {
    e.preventDefault();
    const res = await send("/api/profile", "PATCH", { homeUniversity: uni });
    setUniState(res?.ok ? "saved" : "error");
  }

  async function relink(row: LaRow, homeCourseId: string | null) {
    const set = (id: string | null) =>
      setRows((rs) =>
        rs.map((r) =>
          r.id === row.id ? { ...r, homeCourseId: id, homeCourseName: homeCourses.find((h) => h.id === id)?.name ?? null } : r,
        ),
      );
    set(homeCourseId);
    const res = await send(`/api/la/${row.id}`, "PATCH", { homeCourseId });
    if (!res?.ok) {
      set(row.homeCourseId);
      setError("Could not change the home course. Try again.");
    } else setError(null);
  }

  async function remove(row: LaRow) {
    const res = await send(`/api/la?courseId=${encodeURIComponent(row.courseId)}`, "DELETE");
    if (!res?.ok) return setError("Could not remove the course. Try again.");
    setError(null);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
  }

  return (
    <>
      <Link className="linkbtn" href="/matcher" style={{ marginBottom: 10 }}>
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Matcher
      </Link>
      <h1>Learning Agreement draft</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>
        This draft helps you fill in the official Online Learning Agreement. It is not the agreement itself.
      </p>

      <form onSubmit={saveUni} style={{ maxWidth: 480, marginBottom: 16 }}>
        <label htmlFor="homeUni">Home university</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            id="homeUni"
            maxLength={200}
            placeholder="e.g. University of Porto"
            value={uni}
            onChange={(e) => {
              setUni(e.target.value);
              setUniState("idle");
            }}
          />
          <button type="submit" className="btn btn-quiet">
            Save
          </button>
        </div>
        <p className="muted" style={{ margin: "4px 0 0" }} role="status">
          {uniState === "saved" ? "Saved." : uniState === "error" ? "Could not save. Try again." : "Shown on the printed draft."}
        </p>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Semester</th>
              <th>Code</th>
              <th>UPT course</th>
              <th>Faculty</th>
              <th>Programme</th>
              <th>Study year</th>
              <th>ECTS</th>
              <th>Matched home course</th>
              <th>
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 28, color: "var(--sub)" }}>
                  Your draft is empty. Add courses from the Matcher or the Catalogue.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.season}</td>
                <td className="code">{r.code}</td>
                <td>
                  <b>{r.name}</b>
                </td>
                <td>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FacultyDot code={r.facultyCode} name={r.facultyName} sm />
                    <span aria-hidden="true">{r.facultyName}</span>
                  </span>
                </td>
                <td>{r.programme}</td>
                <td>{r.studyYear}</td>
                <td>{r.ects}</td>
                <td>
                  <select
                    style={{ minWidth: 180 }}
                    aria-label={`Matched home course for ${r.name}`}
                    value={r.homeCourseId ?? ""}
                    onChange={(e) => relink(r, e.target.value || null)}
                  >
                    <option value="">No home course</option>
                    {homeCourses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="btn btn-quiet" aria-label={`Remove ${r.name}`} onClick={() => remove(r)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "12px 0 0" }}>
        <b>Winter:</b> {t.winter} ECTS · <b>Summer:</b> {t.summer} ECTS
      </p>
      {error && (
        <div className="error on" role="alert">
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <a className="btn btn-primary" href="/api/la/export" download>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
          Export CSV
        </a>
        <Link className="btn btn-quiet" href="/la/print">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z" />
          </svg>
          Printable view
        </Link>
      </div>
    </>
  );
}
