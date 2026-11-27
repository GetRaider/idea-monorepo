"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useCountersEnabled } from "../../settings/use-counters-enabled";

/** Counters pages are reachable only while the module is turned on. */
export default function CountersLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { enabled, isPending } = useCountersEnabled();

  useEffect(() => {
    if (!isPending && !enabled) router.replace("/overview");
  }, [enabled, isPending, router]);

  if (!enabled) return null;
  return children;
}
