"use client";

import { useState } from "react";
import { MatchCard } from "@/components/match-card";
import type { MatchView } from "@/services/matcher";

type State =
  | { status: "idle" }
  | { status: "loading"; name: string }
  | { status: "error"; name: string; message: string }
  | { status: "done"; name: string; matches: MatchView[] };

const SHOWN = 3; // D-05: top 3, "Show more" reveals up to 5

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function MatcherView() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [showAll, setShowAll] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const ects = String(fd.get("ects") ?? "");
    setShowAll(false);
    setState({ status: "loading", name });
    try {
      const created = await post("/api/home-courses", {
        name,
        description: String(fd.get("description") ?? "").trim() || null,
        ects: ects ? Number(ects) : null,
      });
      if (!created.ok) return setState({ status: "error", name, message: "Check the course name and ECTS, then try again." });
      const { id } = await created.json();
      const res = await post("/api/matches", { homeCourseId: id });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        return setState({ status: "error", name, message: data.message ?? "Could not match this course right now. Try again." });
      setState({ status: "done", name, matches: data.matches });
    } catch {
      setState({ status: "error", name, message: "Could not reach the server. Check your connection and try again." });
    }
  }

  return (
    // "mon" keeps both sections visible on phones until the prototype's mobile tabs arrive with the LA column (01-05)
    <div className="cols">
      <section className="pane mon" aria-labelledby="h-home">
        <h2 id="h-home">Your home courses</h2>
        <form onSubmit={onSubmit}>
          <label htmlFor="fName" style={{ marginTop: 0 }}>
            Course name
          </label>
          <input type="text" id="fName" name="name" required maxLength={200} placeholder="e.g. Operating Systems" />
          <label htmlFor="fEcts">ECTS (optional)</label>
          <input type="number" id="fEcts" name="ects" min={0.5} max={60} step={0.5} />
          <label htmlFor="fDesc">Description (optional)</label>
          <textarea
            id="fDesc"
            name="description"
            maxLength={8000}
            placeholder="Paste the course description or list the main topics. It helps tell similar course names apart."
          />
          <div className="stack">
            <button className="btn btn-primary" type="submit" disabled={state.status === "loading"}>
              Find matches
            </button>
          </div>
        </form>
      </section>

      <section className="mon" aria-live="polite">
        {state.status === "idle" ? (
          <div className="empty">
            <b>Add your first home course</b>Type a course from your home university to see similar UPT courses.
          </div>
        ) : (
          <>
            <div className="match-head">
              <div>
                <div className="muted">Matches for</div>
                <h1>{state.name}</h1>
                <div className="muted">
                  Compared by course name. ECTS, semester, faculty and programme come from the UPT catalogue.
                </div>
              </div>
            </div>
            {state.status === "loading" && (
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
            {state.status === "error" && (
              <div className="empty" role="alert">
                <b>Matching failed</b>
                {state.message}
              </div>
            )}
            {state.status === "done" && state.matches.length === 0 && (
              <div className="empty">
                <b>No similar UPT course names</b>Try another name for the course, or browse the catalogue.
              </div>
            )}
            {state.status === "done" && state.matches.length > 0 && (
              <>
                <div className="matches">
                  {(showAll ? state.matches : state.matches.slice(0, SHOWN)).map((m) => (
                    <MatchCard key={m.courseId} m={m} />
                  ))}
                </div>
                {!showAll && state.matches.length > SHOWN && (
                  <button type="button" className="linkbtn" style={{ marginTop: 12 }} onClick={() => setShowAll(true)}>
                    Show {state.matches.length - SHOWN} more
                  </button>
                )}
                <div className="notice" role="note">
                  <div>
                    These are suggestions, not official equivalences. The Erasmus coordinator of the Faculty of
                    Automation and Computers gives final approval:{" "}
                    {[state.matches[0].coordinator.name, state.matches[0].coordinator.email].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
