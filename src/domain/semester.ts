export type SemesterFilter = "any" | "winter" | "summer";
export type Season = "Winter" | "Summer";

// D-04: odd catalogue semesters are Winter, even are Summer.
export const season = (semester: number): Season => (semester % 2 === 1 ? "Winter" : "Summer");

export const matchesFilter = (semester: number, filter: SemesterFilter) =>
  filter === "any" || (filter === "winter") === (semester % 2 === 1);
