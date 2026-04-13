import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { guestStoreHelper } from "@/stores/guest";

export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export async function signOutAndClear() {
  guestStoreHelper.clear();
  await authClient.signOut();
}
