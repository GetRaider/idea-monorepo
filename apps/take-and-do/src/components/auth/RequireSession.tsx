import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth/server";
import { Route } from "@/constants/route.constant";

export async function RequireSession({ children }: { children: ReactNode }) {
  const sessionPayload = await auth.api.getSession({
    headers: await headers(),
  });
  if (!sessionPayload?.session) redirect(Route.LOGIN);
  return <>{children}</>;
}
