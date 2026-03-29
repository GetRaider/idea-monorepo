import { RequireSession } from "@/components/auth/RequireSession";

export default async function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
