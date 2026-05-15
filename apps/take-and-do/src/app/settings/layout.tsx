import type { ReactNode } from "react";

import { RequireSession } from "@/components/auth/RequireSession";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <RequireSession>{children}</RequireSession>;
}
