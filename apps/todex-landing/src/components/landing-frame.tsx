import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WaitlistProvider } from "./waitlist";

export function LandingFrame({ children }: { children: ReactNode }) {
  return (
    <WaitlistProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </WaitlistProvider>
  );
}
