// Pure parser for the AC Erasmus catalogue file (D-17). No IO: callers pass sheet rows or a parsed workbook.
import * as XLSX from "xlsx";

export type Cell = string | number | boolean | null | undefined;
export type Row = Cell[];

export type CourseSeed = {
  id: string;
  facultyCode: "AC";
  level: "B" | "M";
  programme: string;
  field: string | null;
  programmeDesc: string | null;
  name: string;
  code: string;
  studyYear: number;
  semester: number;
  ects: number;
  listedLanguage: string | null;
  languageLabel: string | null;
  sourceYear: "2026-27";
  sourceFile: string;
  sourceRow: number;
};

// Anchored at the start: "Language the course units are taught" also contains "course unit".
const ROLES = {
  programme: /name of the study programme/i,
  field: /field of study/i,
  desc: /programme general description/i,
  course: /^course unit/i,
  code: /^codes?\b/i,
  year: /^year of study/i,
  semester: /^semester/i,
  ects: /^ects/i,
  lang: /^language the course/i,
};
const REQUIRED = ["programme", "course", "code", "year", "semester", "ects"] as const;
type Role = keyof typeof ROLES;

const text = (c: Cell) => (c == null ? null : String(c).trim() || null);

export function findHeaderRow(rows: Row[]): number {
  return rows.findIndex((r) => r.some((c) => /course unit/i.test(String(c ?? ""))));
}

export function mapColumns(header: Row): Partial<Record<Role, number>> {
  const cols: Partial<Record<Role, number>> = {};
  for (const [role, re] of Object.entries(ROLES) as [Role, RegExp][]) {
    const i = header.findIndex((c) => re.test(String(c ?? "").trim()));
    if (i >= 0) cols[role] = i;
  }
  const missing = REQUIRED.filter((r) => cols[r] === undefined);
  if (missing.length) throw new Error(`catalogue header has no column for: ${missing.join(", ")}`);
  return cols;
}

export function languageLabel(raw: Cell): string | null {
  const t = text(raw);
  if (!t) return null;
  if (/^english/i.test(t)) return "English";
  if (/^roman/i.test(t)) return "Romanian";
  return t;
}

export function parseSheet(rows: Row[], opts: { level: "B" | "M"; sourceFile: string; sheet: string }): CourseSeed[] {
  const h = findHeaderRow(rows);
  if (h < 0) throw new Error(`${opts.sheet}: no header row with "Course unit"`);
  const cols = mapColumns(rows[h]);
  const at = (r: Row, role: Role) => (cols[role] === undefined ? null : r[cols[role]!]);

  const out: CourseSeed[] = [];
  let programme: string | null = null;
  let desc: string | null = null;
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    const name = text(at(r, "course"));
    const code = text(at(r, "code"));
    if (!name || !code) continue; // gap rows between programmes
    const sourceRow = i + 1; // 1-based Excel row
    const int = (role: Role) => {
      const v = at(r, role);
      const n = typeof v === "number" ? v : /^\s*\d+\s*$/.test(String(v ?? "")) ? Number(v) : NaN;
      if (!Number.isInteger(n)) throw new Error(`${opts.sheet} row ${sourceRow}: ${role} is not an integer (${v})`);
      return n;
    };

    const prog = text(at(r, "programme"));
    if (!prog) throw new Error(`${opts.sheet} row ${sourceRow}: no programme name`);
    if (prog !== programme) desc = null; // description belongs to one programme only
    programme = prog;
    desc = text(at(r, "desc")) ?? desc;

    const lang = text(at(r, "lang"));
    out.push({
      id: `AC-${opts.level}-${sourceRow}`,
      facultyCode: "AC",
      level: opts.level,
      programme: prog,
      field: text(at(r, "field")),
      programmeDesc: desc,
      name,
      code,
      studyYear: int("year"),
      semester: int("semester"),
      ects: int("ects"),
      listedLanguage: lang,
      languageLabel: languageLabel(lang),
      sourceYear: "2026-27",
      sourceFile: opts.sourceFile,
      sourceRow,
    });
  }
  return out;
}

// Bachelor/Licenta and Master sheets only; "Lista" holds dropdown values.
export function readCatalogue(wb: XLSX.WorkBook, sourceFile: string): CourseSeed[] {
  const out: CourseSeed[] = [];
  for (const raw of wb.SheetNames) {
    const sheet = raw.trim();
    if (/^lista$/i.test(sheet)) continue;
    const level = /^licen|^bachelor/i.test(sheet) ? "B" : /^master/i.test(sheet) ? "M" : null;
    if (!level) {
      console.warn(`skipping sheet "${sheet}"`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[raw], { header: 1, defval: null, raw: true });
    out.push(...parseSheet(rows, { level, sourceFile, sheet }));
  }
  return out;
}
