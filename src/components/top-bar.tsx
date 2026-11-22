"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The prototype's sidebar shell; below 760px the CSS turns it into a top bar.
// icon = SVG path data from the prototype; sub items have none.
const NAV = [
  { href: "/matcher", label: "Courses", icon: ["M22 9 12 4 2 9l10 5 10-5z", "M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"] },
  { href: "/catalogue", label: "Catalogue", sub: true },
  { href: "/resources", label: "Resources", icon: ["M6 3h12v18l-6-4-6 4z"] },
  { href: "/first-week", label: "First week", icon: ["M5 21V4M5 4h11l-2 4 2 4H5"] },
];

export function TopBar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !acctRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <header className="side">
      <div className="brand">
        Erasmus<span>@</span>UPT
      </div>
      <nav className="nav" aria-label="Main">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.sub ? "sub" : undefined}
            aria-current={pathname.startsWith(item.href) ? "page" : undefined}
          >
            {item.icon && (
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                {item.icon.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            )}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <div className="acct" ref={acctRef}>
          <button
            className="acct-btn"
            aria-label="Account menu"
            aria-expanded={open}
            aria-controls="acctMenu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="avatar">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </span>
            <span className="acct-txt">
              <b>{name}</b>
              <small>{email}</small>
            </span>
          </button>
          <div className="acct-menu" id="acctMenu" hidden={!open}>
            <Link href="/">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
