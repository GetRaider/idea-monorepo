import { createAuthClient } from 'better-auth/react';

type AuthClient = ReturnType<typeof createAuthClient>;

export const authClient: AuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090',
});

export const useSession: AuthClient['useSession'] = authClient.useSession;
export const signIn: AuthClient['signIn'] = authClient.signIn;
export const signUp: AuthClient['signUp'] = authClient.signUp;
export const signOut: AuthClient['signOut'] = authClient.signOut;
