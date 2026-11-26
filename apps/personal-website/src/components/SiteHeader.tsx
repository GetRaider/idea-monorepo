"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ContactLinks } from "./ContactLinks";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/experience", label: "Experience" },
  { href: "/products", label: "Products" },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** AP mark on the left, nav centred in a pill, direct contacts on the right. */
export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/75 backdrop-blur-md">
      <div className="mx-auto grid h-16 w-full max-w-page grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
        <Link href="/" aria-label="Home" className="justify-self-start rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static mark */}
          <img src="/ap-mark.png" alt="" width={36} height={36} className="size-9 rounded-full" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isCurrent(pathname, href) ? "page" : undefined}
                  className="block rounded-full px-4 py-1.5 text-sm text-mist transition-colors hover:text-cream aria-[current=page]:bg-white/[0.08] aria-[current=page]:text-cream"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-start-3 flex items-center justify-self-end gap-2">
          <ContactLinks variant="icons" className="hidden sm:flex" />
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-white/15 text-cream hover:border-white/30 md:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
              <path
                d={menuOpen ? "M5 5l10 10M15 5L5 15" : "M3.5 6.5h13M3.5 13.5h13"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <nav
        id={menuId}
        aria-label="Main mobile"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full border-b border-white/10 bg-ink px-5 pb-5 pt-2 shadow-[0_24px_48px_rgba(0,0,0,0.6)] md:hidden"
      >
        <ul className="flex flex-col">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent(pathname, href) ? "page" : undefined}
                className="block rounded px-2 py-3 text-base text-cream/90 hover:text-cream aria-[current=page]:text-ember"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <ContactLinks variant="icons" className="mt-3 px-1 sm:hidden" />
      </nav>
    </header>
  );
}
