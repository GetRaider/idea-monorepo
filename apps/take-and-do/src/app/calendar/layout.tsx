import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/RequireSession";

export const metadata: Metadata = {
  title: "Calendar",
};

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
