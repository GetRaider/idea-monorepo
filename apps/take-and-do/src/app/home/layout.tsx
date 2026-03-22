import { RequireSession } from "@/components/auth/RequireSession";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
