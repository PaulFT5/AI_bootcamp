// Writes scripts/fixtures/syllabus-sample.pdf: a one-page, one-course syllabus for the extraction smoke.
// Hand-built PDF objects with a correct xref table. Run: npx tsx scripts/fixtures/make-sample-pdf.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const LINES = [
  "University of Example - Faculty of Informatics",
  "Course: Operating Systems Principles",
  "ECTS credits: 6",
  "Year of study: 2",
  "Description: How an operating system manages processes, memory and storage.",
  "Topics: Processes and threads; CPU scheduling; Memory management; File systems;",
  "Synchronisation; Virtualisation",
];

const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
const stream = ["BT", "/F1 12 Tf", "16 TL", "56 780 Td", ...LINES.map((l) => `(${esc(l)}) '`), "ET"].join("\n");

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
];

let pdf = "%PDF-1.4\n";
const offsets: number[] = [];
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf, "latin1"));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf, "latin1");
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

const out = join(__dirname, "syllabus-sample.pdf");
writeFileSync(out, pdf, "latin1");
console.log(`wrote ${out} (${pdf.length} bytes)`);
