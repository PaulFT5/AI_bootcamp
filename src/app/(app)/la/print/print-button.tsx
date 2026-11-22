"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z" />
      </svg>
      Print
    </button>
  );
}
