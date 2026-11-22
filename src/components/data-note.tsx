"use client";

import { usePathname } from "next/navigation";

// Resources and First week say where their data comes from (the prototype's per-tab banners).
const NOTES: Record<string, string> = {
  "/resources":
    "In Resources, steps, offices, embassies, phone numbers and opening hours come from the official pages linked on each card. Checked 21 Nov 2026.",
  "/first-week":
    "In First week, offices, buildings and rooms come from official UPT pages and the official UPT map, checked 21 Nov 2026.",
};

export function DataNote() {
  return <div className="data-note">{NOTES[usePathname()] ?? "Erasmus Course Catalogue 2026-27 · Automation and Computers"}</div>;
}
