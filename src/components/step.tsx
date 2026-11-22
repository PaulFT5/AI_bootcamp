"use client";

import { useState, type ReactNode } from "react";
import { Chev } from "./sourced";

// Collapsible numbered card (prototype resCard / fwDay). p picks the res- or fw- class family.
export function Step({ p, id, n, title, children }: { p: "res" | "fw"; id: string; n: number; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`${p}-step`}>
      <h3>
        <button
          type="button"
          className={`${p}-head`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`${p}-num`}>{n}</span>
          <span className={`${p}-title`}>{title}</span>
          <Chev className={`${p}-chev`} />
        </button>
      </h3>
      <div className={`${p}-body`} id={id} hidden={!open}>
        {children}
      </div>
    </article>
  );
}
