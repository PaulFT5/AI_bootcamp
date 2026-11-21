import { FacultyDot } from "@/components/faculty-dot";
import type { MatchView } from "@/services/matcher";

const DocIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);
const TagIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);
const CheckIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Prototype `.match` card. Every fact comes from the catalogue row (MATCH-03); no percentages (D-06).
// evidenceLabel is "Compared by catalogue entry", "Topics inferred from course name" or "Compared with UPT syllabus".
export function MatchCard({ m }: { m: MatchView }) {
  return (
    <article className={`match band-${m.band}`}>
      <FacultyDot code={m.facultyCode} name={m.facultyName} />
      <div>
        <span className={`evidence ${m.evidence === "catalogue" ? "ev-cat" : "ev-syl"}`}>
          {m.evidence === "catalogue" ? <TagIcon /> : <DocIcon />}
          {m.evidenceLabel}
        </span>
        <div className="code">{m.code}</div>
        <div className="mname">{m.name}</div>
        <div className="reason">{m.reason}</div>
        {m.coveredTopics.length + m.missingTopics.length > 0 && (
          <div className="topics">
            {m.coveredTopics.map((t) => (
              <span key={`c-${t}`} className="hit">
                <CheckIcon />
                {t}
              </span>
            ))}
            {m.missingTopics.map((t) => (
              <span key={`m-${t}`} className="miss">
                Not covered: {t}
              </span>
            ))}
          </div>
        )}
        <div className="facts">
          <span className="band">{m.band} match</span>
          <span>{m.ects} ECTS</span>
          <span>{`${m.season} (sem ${m.semester})`}</span>
          <span>Year {m.studyYear}</span>
          <span>{m.facultyName}</span>
          <span>{m.programme}</span>
          {m.languageLabel && <span>Listed language: {m.languageLabel}</span>}
        </div>
      </div>
    </article>
  );
}
