import Link from "next/link";

import { getSignInHref } from "@/lib/app-url";

import { WaitlistButton } from "./waitlist-button";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center gap-4 px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static mark copied from the product */}
          <img
            src="/todex-mark.png"
            alt="Todex"
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
          <WaitlistButton appearance="header" />
        </div>
      </div>
    </header>
  );
}
