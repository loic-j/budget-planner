import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
  fetchOptions: { credentials: 'include' },
});

export const { useSession, signIn, signUp, signOut } = authClient;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
}
