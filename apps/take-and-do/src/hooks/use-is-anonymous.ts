"use client";

import { authClient } from "@/lib/auth-client";

type UserWithAnonymous = {
  isAnonymous?: boolean;
};

export function useIsAnonymous(): boolean {
  const { data: session } = authClient.useSession();
  const user = session?.user as UserWithAnonymous | undefined;
  return user?.isAnonymous ?? false;
}
