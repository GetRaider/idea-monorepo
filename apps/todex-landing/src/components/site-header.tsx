"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ReactNode } from "react";

export function SiteHeader({ signInHref, openTodex }: { signInHref: string; openTodex: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 -mb-20 border-b border-white/10 bg-black/75 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center gap-2 px-3 sm:gap-5 sm:px-8">
        <Link href="/" className="flex items-center gap-1 sm:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static mark copied from the product */}
          <img
            src="/todex-mark.png"
            alt=""
            width={36}
            height={36}
            className="size-6 rounded-md sm:size-9 sm:rounded-lg"
          />
          <span className="text-[15px] font-medium tracking-tight text-white">
            Todex
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2.5 sm:gap-5">
          <Link
            href="/use-cases"
            aria-current={pathname === "/use-cases" ? "page" : undefined}
            className="whitespace-nowrap text-xs text-zinc-300 hover:text-white aria-[current=page]:text-white sm:text-sm"
          >
            Use Cases
          </Link>
          <a
            href={signInHref}
            className="whitespace-nowrap text-xs text-zinc-300 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Sign in
          </a>
          {openTodex}
        </div>
      </div>
    </header>
  );
}
