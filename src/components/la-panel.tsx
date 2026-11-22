"use client";

import Link from "next/link";
import { FacultyDot } from "@/components/faculty-dot";
import { ECTS_TARGET, laTotals, meterStatus } from "@/domain/ects";
import { season } from "@/domain/semester";
import { facultyColourVar } from "@/lib/faculties";
import type { LaRow } from "@/services/la";

export type LaPanelItem = Pick<LaRow, "courseId" | "code" | "name" | "facultyCode" | "facultyName" | "semester" | "ects">;

const SEASONS = ["Winter", "Summer"] as const;
const byCode = (a: LaPanelItem, b: LaPanelItem) => a.code.localeCompare(b.code) || a.courseId.localeCompare(b.courseId);

// Prototype LA pane, one meter per season (D-12). Placement is the catalogue semester; nothing here moves a course.
export function LaPanel({ items, onRemove }: { items: LaPanelItem[]; onRemove: (item: LaPanelItem) => void }) {
  const totals = laTotals(items);
  return (
    <>
      <h2 id="h-la">Learning Agreement draft</h2>
      {SEASONS.map((s) => {
        const total = s === "Winter" ? totals.winter : totals.summer;
        const st = meterStatus(total);
        const rows = items.filter((i) => season(i.semester) === s).sort(byCode);
        return (
          <div key={s} className="la-sem">
            <h3>{s}</h3>
            <div className="total">
              <b style={{ color: total > ECTS_TARGET ? "var(--err)" : "var(--ink)" }}>{total}</b>
              <span>/ 30 ECTS</span>
            </div>
            <div className="meter" role="img" aria-label={`${s}: ${total} of 30 ECTS`}>
              <i style={{ width: `${(total / Math.max(ECTS_TARGET, total)) * 100}%`, background: facultyColourVar("AC") }} />
            </div>
            <div className={`status ${st.key === "empty" ? "under" : st.key}`}>{st.message}</div>
            {rows.length ? (
              <ul className="la-list">
                {rows.map((c) => (
                  <li key={c.courseId}>
                    <FacultyDot code={c.facultyCode} name={c.facultyName} sm />
                    <span>
                      <span className="code">{c.code}</span>
                      <br />
                      {c.name}
                    </span>
                    <b>{c.ects}</b>
                    <button type="button" className="x" aria-label={`Remove ${c.name}`} onClick={() => onRemove(c)}>
                      <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty" style={{ padding: "14px", fontSize: 14 }}>
                No courses yet.
              </div>
            )}
          </div>
        );
      })}
      <div className="stack" style={{ marginTop: 16 }}>
        <Link className="btn btn-primary btn-block" href="/la">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h6" />
          </svg>
          Open full draft
        </Link>
      </div>
    </>
  );
}
