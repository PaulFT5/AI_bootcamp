"use client";

import Form from "next/form";
import { useEffect, useRef } from "react";

type Props = { semester?: string; ects?: number; syllabus: boolean; q?: string; sort?: string; ectsOptions: number[] };

// GET form: works without JS; with JS, selects and the checkbox submit on change and search submits on Enter.
export function CatalogueFilters({ semester, ects, syllabus, q, sort, ectsOptions }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();

  // Uncontrolled inputs keep old values when the URL changes from outside the form (e.g. the sidebar link).
  useEffect(() => {
    const el = (n: string) => ref.current?.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null;
    el("semester")!.value = semester ?? "";
    el("ects")!.value = ects?.toString() ?? "";
    (el("syllabus") as HTMLInputElement).checked = syllabus;
    el("q")!.value = q ?? "";
  }, [semester, ects, syllabus, q]);

  return (
    <Form action="/catalogue" ref={ref} className="cat-bar">
      {sort && <input type="hidden" name="sort" value={sort} />}
      <div>
        <label htmlFor="cSem">Semester</label>
        <select id="cSem" name="semester" defaultValue={semester ?? ""} onChange={submit}>
          <option value="">Any</option>
          <option value="winter">Winter</option>
          <option value="summer">Summer</option>
        </select>
      </div>
      <div>
        <label htmlFor="cEcts">ECTS</label>
        <select id="cEcts" name="ects" defaultValue={ects?.toString() ?? ""} onChange={submit}>
          <option value="">Any</option>
          {ectsOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: "auto" }}>
        <label className="toggle" htmlFor="cSyl">
          <input type="checkbox" id="cSyl" name="syllabus" value="1" defaultChecked={syllabus} onChange={submit} /> With UPT
          syllabus
        </label>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label htmlFor="cQ">Search</label>
        <input type="text" id="cQ" name="q" defaultValue={q ?? ""} placeholder="Course name or code" maxLength={100} />
      </div>
    </Form>
  );
}
