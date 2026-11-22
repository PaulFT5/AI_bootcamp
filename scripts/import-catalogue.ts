// Offline: AC catalogue xlsx -> data/seed/catalogue.json. Only the AC file is read (D-17); the other six stay untouched.
// Run: npm run catalogue:import
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import * as XLSX from "xlsx";
import { readCatalogue } from "./lib/catalogue-parse";

const AC_FILE = "data/raw/catalogue-2024-27/Course_catalogue_Automatics and Computing_2026-2027_ERASMUS.xlsx";
const EXPECTED_ROWS = 204; // measured 2026-11-21: 84 Bachelor + 120 Master

const rows = readCatalogue(XLSX.read(readFileSync(AC_FILE)), basename(AC_FILE)).sort((a, b) => a.id.localeCompare(b.id));
writeFileSync("data/seed/catalogue.json", JSON.stringify(rows, null, 2) + "\n");

const n = (level: string) => rows.filter((r) => r.level === level).length;
console.log(`B=${n("B")} M=${n("M")} total=${rows.length}`);
if (rows.length !== EXPECTED_ROWS) {
  console.error(`expected ${EXPECTED_ROWS} AC rows; update EXPECTED_ROWS only if the AC file changed`);
  process.exit(1);
}
