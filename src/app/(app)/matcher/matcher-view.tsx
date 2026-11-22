"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LaPanel, type LaPanelItem } from "@/components/la-panel";
import { MatchCard } from "@/components/match-card";
import type { SemesterFilter } from "@/domain/semester";
import { sniffKind, uploadError, type ExtractedCourse } from "@/domain/upload";
import { downscaleImage } from "@/lib/downscale";
import sampleSyllabus from "@/lib/syllabus-sample.json";
import type { HomeCourseView } from "@/services/home-courses";
import type { MatchMode, MatchView } from "@/services/matcher";

type Course = Omit<HomeCourseView, "last">;
type Run = { status: "loading" | "done" | "error"; matches: MatchView[]; mode?: MatchMode; message?: string };
type Draft = {
  id?: string; // set when editing
  name: string;
  ects: string;
  studyYear: string;
  description: string;
  topics: string; // one per line
  source: "typed" | "syllabus";
  multi?: boolean; // the uploaded file seemed to hold several courses
};
type Upload = { status: "idle" } | { status: "reading" } | { status: "error"; message: string; offerName: boolean };
type RunOpts = { force?: boolean; byName?: boolean };

const SHOWN = 3; // D-05: top 3, "Show more" reveals up to 5
const FILTERS: { value: SemesterFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "winter", label: "Winter" },
  { value: "summer", label: "Summer" },
];
const EMPTY_DRAFT: Draft = { name: "", ects: "", studyYear: "", description: "", topics: "", source: "typed" };

const send = (url: string, method: string, body?: unknown, signal?: AbortSignal) =>
  fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

// results live in `runs`, so the course list keeps only the course fields
const strip = ({ id, name, description, topics, ects, studyYear, source }: HomeCourseView): Course => ({
  id,
  name,
  description,
  topics,
  ects,
  studyYear,
  source,
});
const needsRun = (c: HomeCourseView, filter: SemesterFilter) => !c.last || c.last.filter !== filter;
const fromExtracted = (x: ExtractedCourse): Draft => ({
  name: x.name, // empty when no name was found: the required field stays empty
  ects: x.ects == null ? "" : String(x.ects),
  studyYear: x.studyYear == null ? "" : String(x.studyYear),
  description: x.description,
  topics: x.topics.join("\n"),
  source: "syllabus",
  multi: x.multipleCoursesDetected,
});
const toDraft = (c: Course): Draft => ({
  id: c.id,
  name: c.name,
  ects: c.ects == null ? "" : String(c.ects),
  studyYear: c.studyYear == null ? "" : String(c.studyYear),
  description: c.description ?? "",
  topics: c.topics.join("\n"),
  source: c.source,
});
const plural = (n: number) => (n === 1 ? "1 match" : `${n} matches`);

function statusText(run: Run | undefined) {
  if (!run) return "Not matched yet";
  if (run.status === "loading") return "Matching…";
  if (run.status === "error") return "Could not match";
  return plural(run.matches.length);
}

export function MatcherView({
  initialCourses,
  initialFilter,
  initialLa,
}: {
  initialCourses: HomeCourseView[];
  initialFilter: SemesterFilter;
  initialLa: LaPanelItem[];
}) {
  const [courses, setCourses] = useState<Course[]>(() => initialCourses.map(strip));
  // D-09: saved results paint immediately; courses never matched, or matched under another filter, start loading
  const [runs, setRuns] = useState<Record<string, Run>>(() =>
    Object.fromEntries(
      initialCourses.map((c) => [
        c.id,
        needsRun(c, initialFilter)
          ? { status: "loading", matches: [] }
          : { status: "done", matches: c.last!.matches, mode: c.last!.mode },
      ]),
    ),
  );
  const [filter, setFilter] = useState(initialFilter);
  const [activeId, setActiveId] = useState<string | null>(initialCourses[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<"courses" | "matches" | "la">("courses");
  const [la, setLa] = useState(initialLa);
  const [toast, setToast] = useState({ msg: "", on: false });
  const toastTimer = useRef<number | undefined>(undefined);
  const controllers = useRef(new Map<string, AbortController>());
  const [upload, setUpload] = useState<Upload>({ status: "idle" });
  const uploadCtl = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // D-08: one request per course with its own AbortController; a newer run for the same course aborts the older one.
  // State is only set after the first await, so the mount effect can call this directly.
  async function fetchMatch(id: string, opts: RunOpts = {}) {
    controllers.current.get(id)?.abort();
    const ctl = new AbortController();
    controllers.current.set(id, ctl);
    const set = (run: Run) => !ctl.signal.aborted && setRuns((rs) => ({ ...rs, [id]: run }));
    try {
      const res = await send("/api/matches", "POST", { homeCourseId: id, ...opts }, ctl.signal);
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        return set({ status: "error", matches: [], message: data.message ?? "Could not match this course right now. Try again." });
      set({ status: "done", matches: data.matches, mode: data.mode });
    } catch {
      set({ status: "error", matches: [], message: "Could not reach the server. Check your connection and try again." });
    }
  }

  function runMatch(id: string, opts: RunOpts = {}) {
    setRuns((rs) => ({ ...rs, [id]: { status: "loading", matches: [] } }));
    void fetchMatch(id, opts);
  }

  useEffect(() => {
    for (const c of initialCourses) if (needsRun(c, initialFilter)) void fetchMatch(c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount, for the courses the server had no result for
  }, []);

  async function changeFilter(f: SemesterFilter) {
    if (f === filter) return;
    const previous = filter;
    setFilter(f);
    const res = await send("/api/profile", "PATCH", { semesterFilter: f }).catch(() => null);
    if (!res?.ok) return setFilter(previous);
    for (const c of courses) runMatch(c.id); // cache hits come back at once
  }

  function select(id: string) {
    setActiveId(id);
    setShowAll(false);
    setTab("matches");
  }

  function openForm(d: Draft) {
    setDraft(d);
    setFormError(null);
    uploadCtl.current?.abort(); // a file still being read must not overwrite this form later
    setUpload({ status: "idle" });
    setTab("courses");
  }

  // MATCH-04: checked in the browser first (no request for a bad file), the server checks again.
  // Each upload aborts the previous one, so only the latest file pre-fills the form.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires change
    if (!file) return;
    uploadCtl.current?.abort();
    const ctl = new AbortController();
    uploadCtl.current = ctl;
    const fail = (message: string, offerName = false) =>
      !ctl.signal.aborted && setUpload({ status: "error", message, offerName });
    setUpload({ status: "reading" });
    try {
      let blob: Blob = file;
      let kind = sniffKind(new Uint8Array(await file.slice(0, 8).arrayBuffer()));
      if (kind === "png" || kind === "jpeg") {
        blob = await downscaleImage(file);
        if (blob !== file) kind = "jpeg";
      }
      const error = uploadError(blob.size, kind);
      if (error) return fail(error);
      const body = new FormData();
      body.append("file", blob, "syllabus");
      const res = await fetch("/api/extract", { method: "POST", body, signal: ctl.signal });
      const data = await res.json().catch(() => ({}));
      if (ctl.signal.aborted) return;
      if (!res.ok) return fail(data.message ?? "Could not read this file. Try again.", res.status >= 500);
      openForm(fromExtracted(data));
    } catch {
      fail("Could not read this file. Try a clearer PDF or a screenshot of one page, or search by name instead.", true);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      topics: draft.topics.split("\n").map((t) => t.trim()).filter(Boolean),
      ects: draft.ects ? Number(draft.ects) : null,
      studyYear: draft.studyYear ? Number(draft.studyYear) : null,
      ...(draft.id ? {} : { source: draft.source }),
    };
    const res = await send(draft.id ? `/api/home-courses/${draft.id}` : "/api/home-courses", draft.id ? "PATCH" : "POST", body).catch(
      () => null,
    );
    if (!res?.ok) return setFormError("Could not save. Check the course name and ECTS (0.5 to 60, in halves), then try again.");
    const course = strip(await res.json());
    setCourses((cs) => (draft.id ? cs.map((c) => (c.id === course.id ? course : c)) : [...cs, course]));
    setDraft(null);
    select(course.id);
    runMatch(course.id); // an edit cleared the saved result on the server (D-09)
  }

  async function remove(c: Course) {
    if (!window.confirm(`Delete "${c.name}" and its matches?`)) return;
    const res = await send(`/api/home-courses/${c.id}`, "DELETE").catch(() => null);
    if (!res || (!res.ok && res.status !== 404)) return window.alert("Could not delete the course. Try again.");
    controllers.current.get(c.id)?.abort();
    const rest = courses.filter((x) => x.id !== c.id);
    setCourses(rest);
    if (activeId === c.id) setActiveId(rest[0]?.id ?? null);
  }

  function showToast(msg: string) {
    setToast({ msg, on: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, on: false })), 2200);
  }

  // Optimistic: the panel updates at once and rolls back if the request fails. Adds link to the active course (D-11).
  async function toggleLa(item: LaPanelItem) {
    const had = la.some((x) => x.courseId === item.courseId);
    const without = (xs: LaPanelItem[]) => xs.filter((x) => x.courseId !== item.courseId);
    setLa((xs) => (had ? without(xs) : [...without(xs), item]));
    const res = await (had
      ? send(`/api/la?courseId=${encodeURIComponent(item.courseId)}`, "DELETE")
      : send("/api/la", "POST", { courseId: item.courseId, homeCourseId: activeId })
    ).catch(() => null);
    if (!res?.ok) {
      setLa((xs) => (had ? [...without(xs), item] : without(xs)));
      return showToast("Could not update your draft. Try again.");
    }
    showToast(had ? "Removed from your draft" : `Added ${item.name} · ${item.ects} ECTS`);
  }

  const laIds = new Set(la.map((x) => x.courseId));
  const laTotal = la.reduce((s, x) => s + x.ects, 0);
  const active = courses.find((c) => c.id === activeId);
  const run = active ? runs[active.id] : undefined;
  const mode = run?.mode ?? (active?.topics.length ? "topics" : "name");
  const matches = run?.status === "done" ? run.matches : [];
  const coordinator = matches[0]?.coordinator;
  const field = (k: "name" | "ects" | "studyYear" | "description" | "topics") => ({
    value: draft?.[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((d) => d && { ...d, [k]: e.target.value }),
  });

  return (
    <>
      <div className="cols">
        <section className={`pane${tab === "courses" ? " mon" : ""}`} aria-labelledby="h-home">
          <h2 id="h-home">Your home courses</h2>
          <div className="sem-tabs" role="group" aria-label="UPT semester">
            {FILTERS.map((f) => (
              <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => changeFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
          <ul className="home-list">
            {courses.map((c) => (
              <li key={c.id}>
                <button type="button" className="home" aria-pressed={c.id === activeId} onClick={() => select(c.id)}>
                  <b>{c.name}</b>
                  <small>
                    {[c.ects != null && `${c.ects} ECTS`, c.source === "syllabus" ? "from syllabus" : "typed", statusText(runs[c.id])]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </button>
              </li>
            ))}
          </ul>
          <div className="stack">
            <button type="button" className="btn btn-quiet btn-block" onClick={() => openForm(EMPTY_DRAFT)}>
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add a course
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-block"
              disabled={upload.status === "reading"}
              onClick={() => fileInput.current?.click()}
            >
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3" />
              </svg>
              Upload syllabus (PDF or image)
            </button>
            <input ref={fileInput} type="file" accept=".pdf,image/png,image/jpeg" hidden onChange={onFile} />
            <button
              type="button"
              className="linkbtn"
              style={{ alignSelf: "center" }}
              onClick={() => openForm(fromExtracted(sampleSyllabus))}
            >
              Try sample syllabus
            </button>
          </div>
          {upload.status === "reading" && (
            <div className="loading-msg" role="status" style={{ marginTop: 10 }}>
              <span className="spin" />
              Reading your syllabus…
            </div>
          )}
          {upload.status === "error" && (
            <div className="error on" role="alert">
              {upload.message}
              {upload.offerName && (
                <div style={{ marginTop: 6 }}>
                  <button type="button" className="linkbtn" onClick={() => openForm(EMPTY_DRAFT)}>
                    Search by name instead
                  </button>
                </div>
              )}
            </div>
          )}

          {draft && (
            <form className="add on" onSubmit={save}>
              {!draft.id && draft.source === "syllabus" && (
                <div className="extract-note on">
                  We filled this in from your syllabus. Check each field before matching.
                  {draft.multi && (
                    <>
                      {" "}
                      This file seems to describe more than one course. We filled in the first one; upload one course
                      per file.
                    </>
                  )}
                </div>
              )}
              <label htmlFor="fName">
                Course name
              </label>
              <input type="text" id="fName" required maxLength={200} placeholder="e.g. Operating Systems" {...field("name")} />
              <div className="row2">
                <div>
                  <label htmlFor="fEcts">ECTS</label>
                  <input type="number" id="fEcts" min={0.5} max={60} step={0.5} {...field("ects")} />
                </div>
                <div>
                  <label htmlFor="fYear">Study year</label>
                  <select id="fYear" {...field("studyYear")}>
                    <option value="">Not set</option>
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label htmlFor="fDesc">Description</label>
              <textarea id="fDesc" maxLength={8000} placeholder="Paste the course description" {...field("description")} />
              <label htmlFor="fTopics">Topics (one per line)</label>
              <textarea id="fTopics" placeholder={"e.g. CPU scheduling\nMemory management"} {...field("topics")} />
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Only the name is required. A description or topic list gives much better matches.
              </p>
              {formError && (
                <div className="error on" role="alert">
                  {formError}
                </div>
              )}
              <div className="stack">
                <button className="btn btn-primary" type="submit">
                  {draft.id ? "Save and re-match" : "Find matches"}
                </button>
                <button className="btn btn-quiet" type="button" onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className={tab === "matches" ? "mon" : undefined} aria-live="polite" aria-label="Matches">
          {!active ? (
            <div className="empty">
              <b>Add your first home course</b>Type a course from your home university, or upload its syllabus.
            </div>
          ) : (
            <>
              <div className="match-head">
                <div>
                  <div className="muted">Matches for</div>
                  <h1>
                    {active.name}
                    {active.ects != null && ` · ${active.ects} ECTS`}
                  </h1>
                  <div className="muted">
                    {mode === "topics"
                      ? `Ranked by topic similarity to ${active.source === "syllabus" ? "your syllabus" : "your topics"}.`
                      : "Ranked by similarity of course names."}{" "}
                    ECTS, semester, faculty and language come from the UPT catalogue.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    disabled={run?.status === "loading"}
                    onClick={() => runMatch(active.id, { force: true })}
                  >
                    Re-run matching
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={() => openForm(toDraft(active))}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={() => remove(active)}>
                    Delete
                  </button>
                </div>
              </div>

              {run?.status === "loading" && (
                <div className="loading">
                  <div className="loading-msg">
                    <span className="spin" />
                    Comparing with UPT courses. This takes a few seconds.
                  </div>
                  <div className="ghost" />
                  <div className="ghost" />
                  <div className="ghost" />
                </div>
              )}
              {run?.status === "error" && (
                <div className="empty" role="alert">
                  <b>Matching failed</b>
                  {run.message}
                  <div className="stack" style={{ alignItems: "center" }}>
                    <button type="button" className="btn btn-outline" onClick={() => runMatch(active.id, { force: true })}>
                      Re-run matching
                    </button>
                    {active.topics.length > 0 && (
                      <button type="button" className="btn btn-quiet" onClick={() => runMatch(active.id, { byName: true })}>
                        Match by name instead
                      </button>
                    )}
                  </div>
                </div>
              )}
              {run?.status === "done" && matches.length === 0 && (
                <div className="empty">
                  <b>No good matches found</b>Add more topics to the description, or browse the catalogue.
                  <div style={{ marginTop: 14 }}>
                    <Link className="btn btn-outline" href="/catalogue">
                      Browse catalogue
                    </Link>
                  </div>
                </div>
              )}
              {matches.length > 0 && (
                <>
                  {mode === "name" && (
                    <div className="notice nudge">
                      <div>
                        Matched by course name. <b>Add topics or upload your home syllabus</b> for a topic-by-topic
                        comparison.
                      </div>
                    </div>
                  )}
                  <div className="matches">
                    {(showAll ? matches : matches.slice(0, SHOWN)).map((m) => (
                      <MatchCard key={m.courseId} m={m} added={laIds.has(m.courseId)} onToggle={() => toggleLa(m)} />
                    ))}
                  </div>
                  {!showAll && matches.length > SHOWN && (
                    <button type="button" className="linkbtn" style={{ marginTop: 12 }} onClick={() => setShowAll(true)}>
                      Show more ({matches.length - SHOWN})
                    </button>
                  )}
                  <div className="notice" role="note">
                    <div>
                      These are suggestions, not official equivalences. The Erasmus coordinator of the Faculty of
                      Automation and Computers gives final approval:{" "}
                      {[coordinator?.name, coordinator?.email].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <section className={`pane la-col sticky${tab === "la" ? " mon" : ""}`} aria-labelledby="h-la">
          <LaPanel items={la} onRemove={toggleLa} />
        </section>
      </div>

      <div className={`toast${toast.on ? " on" : ""}`} role="status">
        {toast.msg}
      </div>

      {/* "mon" picks the visible column below 760 px */}
      <nav className="mtabs" aria-label="Matcher sections">
        <button type="button" aria-pressed={tab === "courses"} onClick={() => setTab("courses")}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v3" />
          </svg>
          Courses
        </button>
        <button type="button" aria-pressed={tab === "matches"} onClick={() => setTab("matches")}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="M9 6h4a4 4 0 0 1 4 4v5" />
          </svg>
          Matches
        </button>
        <button type="button" aria-pressed={tab === "la"} onClick={() => setTab("la")}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 11l3 3 8-8" />
            <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
          </svg>
          {`LA · ${laTotal} ECTS`}
        </button>
      </nav>
    </>
  );
}
