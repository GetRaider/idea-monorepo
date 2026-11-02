"use client";

import { createContext, use, useState, type ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WaitlistDialog } from "./waitlist-dialog";

const WaitlistContext = createContext<(() => void) | null>(null);

export function LandingFrame({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <WaitlistContext.Provider value={() => setOpen(true)}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      {open ? <WaitlistDialog onClose={() => setOpen(false)} /> : null}
    </WaitlistContext.Provider>
  );
}

export function useOpenWaitlist(): () => void {
  const openWaitlist = use(WaitlistContext);
  if (!openWaitlist) {
    throw new Error("useOpenWaitlist must be used inside LandingFrame");
  }
  return openWaitlist;
}
