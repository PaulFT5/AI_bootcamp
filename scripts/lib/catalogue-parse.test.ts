import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { findHeaderRow, languageLabel, mapColumns, parseSheet, readCatalogue } from "./catalogue-parse";

const AC_FILE = "data/raw/catalogue-2024-27/Course_catalogue_Automatics and Computing_2026-2027_ERASMUS.xlsx";

const HEADER = [
  "Name of the study programme - Denumirea programului de studii",
  "Field of study - Domeniul de studii",
  "Programme general description ",
  "Course unit - Denumirea disciplinei",
  "Codes",
  "Year of study - Anul de studiu",
  "Semester - Semestrul",
  "ECTS credits - Credite ECTS",
  "Language the course units are taught  - Limba in care se predau cursurile",
];
const opts = { level: "B" as const, sourceFile: "test.xlsx", sheet: "Bachelor" };

describe("findHeaderRow / mapColumns", () => {
  it("finds the header and does not map the language column as the course column", () => {
    // language column first so a non-anchored /course unit/ would pick it
    const header = [HEADER[8], ...HEADER.slice(0, 8)];
    const rows = [[null, "junk"], header];
    expect(findHeaderRow(rows)).toBe(1);
    const cols = mapColumns(header);
    expect(cols.course).toBe(4);
    expect(cols.lang).toBe(0);
    expect(cols.code).toBe(5);
  });

  it("throws when a required column is missing", () => {
    expect(() => mapColumns(HEADER.filter((h) => h !== "Codes"))).toThrow(/code/);
  });
});

describe("parseSheet", () => {
  it("forward-fills the description only within a programme", () => {
    const rows = [
      HEADER,
      ["Computers (in English)", "CIT", "About computers", "Physics / Fizică", "L1", 1, 1, 4, null],
      ["Computers (in English)", "CIT", null, "Algebra", "L2", 1, 1, 4, null],
      ["Computers (in Romanian)", "CIT", null, "Fizică", "L3", 1, 2, 5, null],
    ];
    const out = parseSheet(rows, opts);
    expect(out.map((c) => c.programmeDesc)).toEqual(["About computers", "About computers", null]);
    expect(out[0]).toMatchObject({ id: "AC-B-2", facultyCode: "AC", sourceRow: 2, semester: 1, ects: 4, studyYear: 1 });
  });

  it("skips gap rows with no name and no code", () => {
    const rows = [
      HEADER,
      ["P", "F", null, "A", "L1", 1, 1, 4, null],
      [null, null, null, null, null, null, null, null, null],
      ["P", "F", null, "B", "L2", 1, 1, 4, null],
    ];
    expect(parseSheet(rows, opts).map((c) => c.id)).toEqual(["AC-B-2", "AC-B-4"]);
  });

  it("throws with sheet and row on a non-integer semester", () => {
    const rows = [HEADER, ["P", "F", null, "A", "L1", 1, "I", 4, null]];
    expect(() => parseSheet(rows, opts)).toThrow(/Bachelor.*row 2.*semester/);
  });

  it("keeps the raw language and its label, and never drops a row for it", () => {
    const rows = [
      HEADER,
      ["P", "F", null, "A", "L1", 1, 1, 4, " ENGLISH - ENGLEZĂ "],
      ["P", "F", null, "B", "L2", 1, 1, 4, "Romanian - Română"],
      ["P", "F", null, "C", "L3", 1, 1, 4, null],
    ];
    const out = parseSheet(rows, opts);
    expect(out.map((c) => [c.listedLanguage, c.languageLabel])).toEqual([
      ["ENGLISH - ENGLEZĂ", "English"],
      ["Romanian - Română", "Romanian"],
      [null, null],
    ]);
  });
});

describe("languageLabel", () => {
  it.each([
    ["ENGLISH - ENGLEZĂ", "English"],
    ["Romanian - Română", "Romanian"],
    ["  ", null],
    [null, null],
    ["French - Franceză", "French - Franceză"],
  ])("%s -> %s", (raw, label) => expect(languageLabel(raw)).toBe(label));
});

describe("real AC file", () => {
  it("imports 204 rows (84 B + 120 M)", () => {
    const rows = readCatalogue(XLSX.read(readFileSync(AC_FILE)), "test.xlsx");
    expect(rows.filter((r) => r.level === "B")).toHaveLength(84);
    expect(rows.filter((r) => r.level === "M")).toHaveLength(120);
    expect(new Set(rows.map((r) => r.code)).size).toBe(204);
    expect(new Set(rows.map((r) => r.id)).size).toBe(204);
    expect(rows.every((r) => r.facultyCode === "AC")).toBe(true);
    expect(rows.filter((r) => r.languageLabel === "English")).toHaveLength(2);
    expect(rows.filter((r) => /in Romanian/i.test(r.programme) && r.programmeDesc)).toHaveLength(0);
  });
});
