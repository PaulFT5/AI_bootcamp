import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, sanitiseExtracted, sniffKind, uploadError } from "./upload";

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

describe("uploadError", () => {
  it("rejects empty files", () => expect(uploadError(0, "pdf")).toBe("The file is empty."));
  it("accepts exactly 10 MB and rejects one byte more", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10485760);
    expect(uploadError(10485760, "pdf")).toBeNull();
    expect(uploadError(10485761, "pdf")).toBe(
      "This file is 10.0 MB. The limit is 10 MB. Try a smaller PDF or a screenshot of one page.",
    );
  });
  it("rejects unknown types", () => expect(uploadError(100, null)).toBe("Upload a PDF, PNG or JPEG file."));
  it("checks emptiness before type", () => expect(uploadError(0, null)).toBe("The file is empty."));
});

describe("sniffKind", () => {
  it("reads magic bytes", () => {
    expect(sniffKind(text("%PDF-1.4\n"))).toBe("pdf");
    expect(sniffKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("png");
    expect(sniffKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
  });
  it("rejects anything else, including truncated signatures", () => {
    expect(sniffKind(text("hello"))).toBeNull();
    expect(sniffKind(text("%PDF"))).toBeNull();
    expect(sniffKind(bytes())).toBeNull();
  });
});

describe("sanitiseExtracted", () => {
  it("keeps half ECTS and drops values outside 0.5-60", () => {
    expect(sanitiseExtracted({ ects: 7.5 }).ects).toBe(7.5);
    expect(sanitiseExtracted({ ects: 0 }).ects).toBeNull();
    expect(sanitiseExtracted({ ects: 75 }).ects).toBeNull();
    expect(sanitiseExtracted({ ects: "6" }).ects).toBeNull();
    expect(sanitiseExtracted({ ects: 6.2 }).ects).toBe(6); // the course form takes halves only
  });
  it("keeps whole study years 1-6", () => {
    expect(sanitiseExtracted({ studyYear: 2.0 }).studyYear).toBe(2);
    expect(sanitiseExtracted({ studyYear: 9 }).studyYear).toBeNull();
    expect(sanitiseExtracted({ studyYear: 2.5 }).studyYear).toBeNull();
  });
  it("trims topics, drops empty ones, caps at 30 of 200 chars", () => {
    const out = sanitiseExtracted({ topics: ["  Paging ", "", "   ", "x".repeat(300), ...Array(40).fill("t"), 5] });
    expect(out.topics[0]).toBe("Paging");
    expect(out.topics[1]).toHaveLength(200);
    expect(out.topics).toHaveLength(30);
  });
  it("trims the name to 200 chars and defaults missing fields", () => {
    expect(sanitiseExtracted({ name: `  ${"n".repeat(250)}` }).name).toHaveLength(200);
    expect(sanitiseExtracted({})).toEqual({
      name: "",
      description: "",
      ects: null,
      studyYear: null,
      topics: [],
      multipleCoursesDetected: false,
    });
  });
});
