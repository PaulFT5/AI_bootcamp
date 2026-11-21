import { facultyColourVar } from "@/lib/faculties";

// The prototype's metro-line dot. The code is visible text and the name is read out, so colour is never the only cue.
export function FacultyDot({ code, name, sm }: { code: string; name: string; sm?: boolean }) {
  return (
    <span className={sm ? "line sm" : "line"} style={{ background: facultyColourVar(code) }} title={name}>
      <span aria-hidden="true">{code}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}
