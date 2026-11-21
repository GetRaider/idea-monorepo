"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { JoinWaitlistButton } from "./waitlist";

const NAV_ITEMS = [
  { href: "/#why-todex", label: "Why Todex" },
  { href: "/#workflow", label: "How it works" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/#faq", label: "FAQ" },
] as const;

const focusRing =
  "rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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

  const isCurrent = (href: string) => (href === pathname ? "page" : undefined);

  return (
    <header className="sticky top-0 z-20 -mb-20 border-b border-white/10 bg-black/75 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center gap-2 px-3 sm:gap-5 sm:px-8">
        <Link href="/" className={`flex items-center gap-1.5 sm:gap-2.5 ${focusRing}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static mark copied from the product */}
          <img
            src="/todex-mark.png"
            alt=""
            width={36}
            height={36}
            className="size-7 rounded-md sm:size-9 sm:rounded-lg"
          />
          <span className="text-[15px] font-medium tracking-tight text-white">Todex</span>
        </Link>

        <nav aria-label="Main" className="ml-6 hidden md:block lg:ml-10">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isCurrent(href)}
                  className={`block whitespace-nowrap px-3 py-2 text-sm text-zinc-300 hover:text-white aria-[current=page]:text-white ${focusRing}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <JoinWaitlistButton />
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className={`inline-flex size-10 items-center justify-center rounded-lg border border-white/15 text-zinc-200 hover:border-white/30 hover:text-white md:hidden ${focusRing}`}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
              {menuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M3.5 6.5h13M3.5 13.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <nav
        id={menuId}
        aria-label="Main"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full border-y border-white/10 bg-black px-3 pb-5 pt-2 shadow-[0_24px_48px_rgba(0,0,0,0.6)] md:hidden"
      >
        <ul className="flex flex-col">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent(href)}
                onClick={() => setMenuOpen(false)}
                className={`block px-2 py-3 text-base text-zinc-200 hover:text-white aria-[current=page]:text-white ${focusRing}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
