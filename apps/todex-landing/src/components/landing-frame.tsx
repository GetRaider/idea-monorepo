import type { ReactNode } from "react";

import { getSignInHref } from "@/lib/app-url";

import { OpenTodexLink } from "./open-todex-link";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LandingFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader signInHref={getSignInHref()} openTodex={<OpenTodexLink />} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
