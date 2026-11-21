import Link from "next/link";
import { FacultyDot } from "@/components/faculty-dot";
import { catalogueFacets, listCourses } from "@/services/catalogue";

const season = (semester: number) => (semester % 2 === 1 ? "Winter" : "Summer");

export default async function CataloguePage() {
  const [courses, facets] = await Promise.all([listCourses(), catalogueFacets()]);
  return (
    <>
      <h1>UPT course catalogue</h1>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        {`Erasmus Course Catalogue ${facets.sourceYear} · Automation and Computers`}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Course</th>
              <th>ECTS</th>
              <th>When</th>
              <th>Programme</th>
              <th>Language</th>
              <th>Syllabus</th>
            </tr>
          </thead>
          <tbody>
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
                <td>
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
