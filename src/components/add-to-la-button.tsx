"use client";

import { useState } from "react";

const CheckIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Catalogue rows have no home course: they show "No home course" on /la until linked there (D-11).
export function AddToLaButton({ courseId, name, initialAdded }: { courseId: string; name: string; initialAdded: boolean }) {
  const [added, setAdded] = useState(initialAdded);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(
      added ? `/api/la?courseId=${encodeURIComponent(courseId)}` : "/api/la",
      added
        ? { method: "DELETE" }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, homeCourseId: null }) },
    ).catch(() => null);
    if (res?.ok) setAdded(!added);
    setBusy(false);
  }

  return (
    <button
      type="button"
      className={`btn ${added ? "added" : "btn-outline"}`}
      style={{ padding: "6px 12px" }}
      aria-pressed={added}
      aria-label={`${added ? "Added" : "Add"}: ${name}`}
      disabled={busy}
      onClick={toggle}
    >
      {added ? (
        <>
          <CheckIcon />
          Added
        </>
      ) : (
        "Add"
      )}
    </button>
  );
}
