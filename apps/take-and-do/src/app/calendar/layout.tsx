import { RequireSession } from "@/components/auth/RequireSession";

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
