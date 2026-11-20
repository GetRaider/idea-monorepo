import Link from "next/link";

import { getSignInHref } from "@/lib/app-url";

import { OpenTodexLink } from "./open-todex-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 -mb-20 border-b border-white/10 bg-black/75 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center gap-4 px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static mark copied from the product */}
          <img
            src="/todex-mark.png"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-lg"
          />
          <span className="text-[15px] font-medium tracking-tight text-white">
            Todex
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <a
            href={getSignInHref()}
            className="text-sm text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Sign in
          </a>
          <OpenTodexLink />
        </div>
      </div>
    </header>
  );
}
