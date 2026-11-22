import Link from "next/link";
import type { ReactNode } from "react";

// Shared by the Resources and First week pages (server and client). Ported from the prototype's res*/fw* helpers.

export const host = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
};
export const mapsUrl = (q: string) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

export function Chev({ className }: { className: string }) {
  return (
    <svg className={`i ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function InfoNotice() {
  return (
    <div className="notice" role="note">
      <svg className="i" viewBox="0 0 24 24" style={{ marginTop: 1 }} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <div>
        Informational only. Verify with <a href="mailto:incoming@upt.ro">incoming@upt.ro</a>.
      </div>
    </div>
  );
}

// External links: only http(s) becomes an anchor; anything else is shown as plain text.
export function ExtLink({ url, className, children }: { url: string; className?: string; children: ReactNode }) {
  if (!/^https?:\/\//i.test(url)) return <>{children}</>;
  return (
    <a className={className} href={url} target="_blank" rel="noopener">
      {children}
      <span className="res-vh"> (opens in a new tab)</span>
      <span aria-hidden="true">
        <svg className="i" viewBox="0 0 24 24">
          <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      </span>
    </a>
  );
}

type Source = {
  url: string;
  quote?: string | null;
  extraQuotes?: string[];
  gloss?: string | null;
  pageRef?: string | null;
  verified?: string;
} | null;

export function SourceBox({ source: s }: { source?: Source }) {
  if (!s || !s.url) return null;
  return (
    <div className="res-src">
      <p>
        <ExtLink url={s.url}>{"Source: " + host(s.url)}</ExtLink>
        {s.pageRef ? <> <span className="res-ref">{s.pageRef}</span></> : null}
      </p>
      {s.quote && <blockquote cite={s.url}>{s.quote}</blockquote>}
      {s.extraQuotes?.map((x) => <blockquote key={x} cite={s.url}>{x}</blockquote>)}
      {s.quote && s.gloss && <p>In English: {s.gloss}</p>}
      {s.verified && <p>Verified: {s.verified}</p>}
    </div>
  );
}

// Prototype "view" ids mapped to app routes; actions pointing at a page the app lacks are dropped, as the prototype did.
const VIEW_HREF: Record<string, string> = { matcher: "/matcher", catalogue: "/catalogue", resources: "/resources", firstweek: "/first-week" };

export function actionLinks(actions: { label: string; view: string }[] | undefined, className: string) {
  return (actions ?? [])
    .filter((a) => VIEW_HREF[a.view])
    .map((a) => (
      <Link key={a.label} className={className} href={VIEW_HREF[a.view]}>
        {a.label}
      </Link>
    ));
}
