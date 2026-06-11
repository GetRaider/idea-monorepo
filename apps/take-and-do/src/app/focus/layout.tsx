import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/RequireSession";

export const metadata: Metadata = {
  title: "Focus",
};

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
