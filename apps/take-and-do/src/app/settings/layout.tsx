import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RequireSession } from "@/components/auth/RequireSession";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <RequireSession>{children}</RequireSession>;
}
