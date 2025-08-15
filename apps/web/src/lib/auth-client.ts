import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090',
});

export const { useSession, signIn, signUp, signOut } = authClient;
