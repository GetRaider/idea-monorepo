import { createAuthClient } from "better-auth/react";

import { env } from "./env";

type AuthClient = ReturnType<typeof createAuthClient>;

export const authClient: AuthClient = createAuthClient({
  baseURL: env.api.baseUrl,
});

export const useSession: AuthClient["useSession"] = authClient.useSession;
export const signIn: AuthClient["signIn"] = authClient.signIn;
export const signUp: AuthClient["signUp"] = authClient.signUp;
export const signOut: AuthClient["signOut"] = authClient.signOut;
