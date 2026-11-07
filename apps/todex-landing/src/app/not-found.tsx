import Link from "next/link";

import { LandingFrame } from "@/components/landing-frame";
import { WaitlistButton } from "@/components/waitlist-button";

export default function NotFound() {
  return (
    <LandingFrame>
      <div className="mx-auto flex w-full max-w-page flex-col items-start gap-6 px-5 py-24">
        <h1 className="text-4xl font-medium tracking-tight text-white">
          Page not found
        </h1>
        <Link
          href="/"
          className="text-sm text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Home
        </Link>
        <WaitlistButton />
      </div>
    </LandingFrame>
  );
}
