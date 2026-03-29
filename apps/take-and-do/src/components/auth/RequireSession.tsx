import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function RequireSession({ children }: { children: ReactNode }) {
  const sessionPayload = await auth.api.getSession({
    headers: await headers(),
  });
  if (!sessionPayload?.session) redirect("/login");
  return <>{children}</>;
}
