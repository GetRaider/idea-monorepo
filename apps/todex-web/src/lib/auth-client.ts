import { apiKeyClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.api.baseUrl,
  plugins: [apiKeyClient()],
  fetchOptions: {
    credentials: "include",
  },
});

type AuthClient = typeof authClient;

export const useSession: AuthClient["useSession"] = authClient.useSession;
export const signIn: AuthClient["signIn"] = authClient.signIn;
export const signOut: AuthClient["signOut"] = authClient.signOut;
export const linkSocial: AuthClient["linkSocial"] = authClient.linkSocial;
