import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/RequireSession";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
