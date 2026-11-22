import { describe, expect, it } from "vitest";
import { LA_CSV_HEADER, toCsv } from "./csv";

describe("toCsv", () => {
  it("starts with a BOM and joins rows with CRLF", () => {
    const out = toCsv([["a", "b"], ["c", "d"]]);
    expect(out.charCodeAt(0)).toBe(0xfeff);
    expect(out.slice(1)).toBe("a,b\r\nc,d");
  });
  it("quotes commas and doubles quotes", () => expect(toCsv([["x,y", 'say "hi"']]).slice(1)).toBe('"x,y","say ""hi"""'));
  it("guards formula-looking strings but never numbers", () =>
    expect(toCsv([["=SUM(A1)", "+1", "-2", "@x", 5, -3]]).slice(1)).toBe("'=SUM(A1),'+1,'-2,'@x,5,-3"));
  it("guards and quotes together", () => expect(toCsv([['=HYPERLINK("x")']]).slice(1)).toBe(`"'=HYPERLINK(""x"")"`));
  it("guards tab and CR prefixes", () => expect(toCsv([["\tx", "\rx"]]).slice(1)).toBe(`'\tx,"'\rx"`));
  it("empty cells", () => expect(toCsv([[null, ""]]).slice(1)).toBe(","));
  it("keeps Romanian diacritics and newlines quoted", () =>
    expect(toCsv([["Proiectare, tehnologii și știință", "a\nb"]]).slice(1)).toBe('"Proiectare, tehnologii și știință","a\nb"'));
  it("D-13 header", () =>
    expect(toCsv([LA_CSV_HEADER]).slice(1)).toBe(
      "Semester,UPT code,UPT course,Faculty,Programme,Study year,ECTS,Matched home course,Home course ECTS",
    ));
});
