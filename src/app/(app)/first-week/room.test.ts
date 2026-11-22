import { expect, test } from "vitest";
import { roomInfo } from "./client";

test("room lookup is exact, case- and space-insensitive, and ignores prototype keys", () => {
  expect(roomInfo(" b 426 ")).toMatchObject({ code: "B426", corp: "B", floor: 4 });
  expect(roomInfo("Z999")).toBeNull();
  expect(roomInfo("B42")).toBeNull();
  for (const k of ["__proto__", "constructor", "toString", ""]) expect(roomInfo(k)).toBeNull();
});
