import { season } from "./semester";

export const ECTS_TARGET = 30;

/** ECTS per season; the season always comes from the catalogue semester (D-12). One faculty in scope (D-17). */
export function laTotals(items: { semester: number; ects: number }[]) {
  const t = { winter: 0, summer: 0 };
  for (const i of items) t[season(i.semester) === "Winter" ? "winter" : "summer"] += i.ects;
  return t;
}

export type MeterKey = "empty" | "under" | "at" | "over";

/** The prototype's status line (D-12). */
export function meterStatus(total: number): { key: MeterKey; message: string } {
  if (total === 0) return { key: "empty", message: "Add courses to start your draft." };
  if (total < ECTS_TARGET) return { key: "under", message: `${ECTS_TARGET - total} ECTS to go for a full semester (30).` };
  if (total === ECTS_TARGET) return { key: "at", message: "Full semester: 30 ECTS." };
  return { key: "over", message: `${total - ECTS_TARGET} ECTS over the usual 30. Check with your coordinator.` };
}
