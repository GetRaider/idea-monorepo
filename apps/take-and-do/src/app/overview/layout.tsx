import { RequireSession } from "@/components/Auth/RequireSession";

export default async function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
