import Link from "next/link";
import { z } from "zod";
import { FacultyDot } from "@/components/faculty-dot";
import { catalogueFacets, listCourses } from "@/services/catalogue";
import { CatalogueFilters } from "./filters";

const season = (semester: number) => (semester % 2 === 1 ? "Winter" : "Summer");

// Invalid or unknown values (incl. a leftover `faculty`) are ignored, never an error.
const Params = z.object({
  semester: z.enum(["winter", "summer"]).optional().catch(undefined),
  ects: z.coerce.number().int().positive().optional().catch(undefined),
  syllabus: z.literal("1").optional().catch(undefined),
  q: z.string().trim().transform((s) => s.slice(0, 100)).optional().catch(undefined),
  sort: z.enum(["name", "ects"]).optional().catch(undefined),
});

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = Params.parse(await searchParams);
  const q = p.q || undefined;
  const [courses, facets] = await Promise.all([
    listCourses({ semester: p.semester, ects: p.ects, hasSyllabus: p.syllabus === "1", q, sort: p.sort }),
    catalogueFacets(),
  ]);

  const sortHref = (sort: "name" | "ects") => {
    const qs = new URLSearchParams();
    if (p.semester) qs.set("semester", p.semester);
    if (p.ects) qs.set("ects", String(p.ects));
    if (p.syllabus) qs.set("syllabus", "1");
    if (q) qs.set("q", q);
    if (sort === "ects") qs.set("sort", "ects");
    return `/catalogue${qs.size ? `?${qs}` : ""}`;
  };
  const sortedBy = p.sort ?? "name";
  const sortIcon = (
    <svg className="i" viewBox="0 0 24 24" style={{ width: 14, height: 14 }} aria-hidden="true">
      <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
    </svg>
  );

  return (
    <>
      <h1>UPT course catalogue</h1>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        {`Erasmus Course Catalogue ${facets.sourceYear} · Automation and Computers`}
      </p>
      <div className="coverage">
        <span>{`UPT syllabi: ${facets.withSyllabus} of ${facets.total} courses. The others are compared by catalogue entry.`}</span>
        <span>
          Automation and Computers courses only for now. Other faculties: ask{" "}
          <a href="mailto:incoming@upt.ro">incoming@upt.ro</a>.
        </span>
      </div>
      <CatalogueFilters
        semester={p.semester}
        ects={p.ects}
        syllabus={p.syllabus === "1"}
        q={q}
        sort={p.sort}
        ectsOptions={facets.ects}
      />
      <p className="muted" role="status" style={{ margin: "0 0 8px" }}>
        {`${courses.length} course${courses.length === 1 ? "" : "s"}`}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Faculty</th>
              <th aria-sort={sortedBy === "name" ? "ascending" : undefined}>
                <Link href={sortHref("name")}>
                  Course {sortIcon}
                </Link>
              </th>
              <th aria-sort={sortedBy === "ects" ? "ascending" : undefined}>
                <Link href={sortHref("ects")}>
                  ECTS {sortIcon}
                </Link>
              </th>
              <th>When</th>
              <th>Programme</th>
              <th>Language</th>
              <th>Syllabus</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 28, color: "var(--sub)" }}>
                  No courses match these filters.
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c.id} data-course-id={c.id}>
                <td>
                  <FacultyDot code={c.facultyCode} name={c.facultyName} sm />
                </td>
                <td>
                  <span className="code">{c.code}</span>
                  <br />
                  <b>{c.name}</b>
                </td>
                <td>{c.ects}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  Year {c.studyYear} · {season(c.semester)} (sem {c.semester})
                </td>
                <td>{c.programme}</td>
                <td>{c.languageLabel && <span className="muted">Listed language: {c.languageLabel}</span>}</td>
                <td>
                  {c.hasSyllabus ? (
                    <Link className="linkbtn" href={`/syllabus/${c.id}`}>
                      View syllabus
                    </Link>
                  ) : (
                    <span className="nosyl">Syllabus not available yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
