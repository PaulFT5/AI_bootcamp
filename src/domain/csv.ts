// D-13 column order.
export const LA_CSV_HEADER = [
  "Semester",
  "UPT code",
  "UPT course",
  "Faculty",
  "Programme",
  "Study year",
  "ECTS",
  "Matched home course",
  "Home course ECTS",
];

export type CsvCell = string | number | null | undefined;

const cell = (v: CsvCell) => {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; // formula-injection guard (RESEARCH Pitfall 14)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** UTF-8 BOM (so Excel reads diacritics) + CRLF rows. */
export const toCsv = (rows: CsvCell[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
