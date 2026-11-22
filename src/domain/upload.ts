// MATCH-04 upload rules, shared by the browser check and the server re-check. Pure, no IO.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadKind = "pdf" | "png" | "jpeg";
export const MIME: Record<UploadKind, string> = { pdf: "application/pdf", png: "image/png", jpeg: "image/jpeg" };

const startsWith = (bytes: Uint8Array, sig: number[]) => sig.every((b, i) => bytes[i] === b);

/** File type from the first bytes only; the file name and the browser's MIME type are never trusted. */
export function sniffKind(bytes: Uint8Array): UploadKind | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  return null;
}

export function uploadError(size: number, kind: UploadKind | null): string | null {
  if (size === 0) return "The file is empty.";
  if (size > MAX_UPLOAD_BYTES)
    return `This file is ${(size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB. Try a smaller PDF or a screenshot of one page.`;
  if (!kind) return "Upload a PDF, PNG or JPEG file.";
  return null;
}

export type ExtractedCourse = {
  name: string;
  description: string;
  ects: number | null;
  studyYear: number | null;
  topics: string[];
  multipleCoursesDetected: boolean;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Model output -> values the course form accepts (same limits as the home-course API). */
export function sanitiseExtracted(raw: Partial<Record<keyof ExtractedCourse, unknown>>): ExtractedCourse {
  const ects = typeof raw.ects === "number" && raw.ects >= 0.5 && raw.ects <= 60 ? Math.round(raw.ects * 2) / 2 : null;
  const year = raw.studyYear;
  return {
    name: str(raw.name, 200),
    description: str(raw.description, 8000),
    ects,
    studyYear: typeof year === "number" && Number.isInteger(year) && year >= 1 && year <= 6 ? year : null,
    topics: (Array.isArray(raw.topics) ? raw.topics : [])
      .map((t) => str(t, 200))
      .filter(Boolean)
      .slice(0, 30),
    multipleCoursesDetected: raw.multipleCoursesDetected === true,
  };
}
