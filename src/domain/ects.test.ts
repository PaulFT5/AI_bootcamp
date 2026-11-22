import { describe, expect, it } from "vitest";
import { ECTS_TARGET, laTotals, meterStatus } from "./ects";

describe("meterStatus", () => {
  it("empty", () => expect(meterStatus(0)).toEqual({ key: "empty", message: "Add courses to start your draft." }));
  it("under", () => {
    expect(meterStatus(29)).toEqual({ key: "under", message: "1 ECTS to go for a full semester (30)." });
    expect(meterStatus(1).message).toBe("29 ECTS to go for a full semester (30).");
  });
  it("at", () => expect(meterStatus(ECTS_TARGET)).toEqual({ key: "at", message: "Full semester: 30 ECTS." }));
  it("over", () =>
    expect(meterStatus(31)).toEqual({ key: "over", message: "1 ECTS over the usual 30. Check with your coordinator." }));
});

describe("laTotals", () => {
  it("sums by catalogue semester parity", () =>
    expect(laTotals([{ semester: 3, ects: 5 }, { semester: 4, ects: 6 }, { semester: 9, ects: 4 }])).toEqual({ winter: 9, summer: 6 }));
  it("empty", () => expect(laTotals([])).toEqual({ winter: 0, summer: 0 }));
  it("semester 1 is always winter", () => expect(laTotals([{ semester: 1, ects: 5 }])).toEqual({ winter: 5, summer: 0 }));
});
