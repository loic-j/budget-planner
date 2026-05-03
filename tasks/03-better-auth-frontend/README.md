# Task 03 — Better Auth Frontend + Auth Screens

## Status

`TODO`

## Description

Set up the Better Auth client on the frontend, configure React Router, implement the auth guard, and build Login, Register, and Email Verification screens.

## What to build

### Auth client

**`apps/web/src/lib/auth.ts`**

```typescript
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
  fetchOptions: { credentials: 'include' },
});
export const { useSession, signIn, signUp, signOut } = authClient;
export interface SessionUser {
  id;
  name;
  email;
  emailVerified;
  role?;
}
```

### React Router setup

**`apps/web/src/main.tsx`** — wrap app in `<BrowserRouter>`

**`apps/web/src/router.tsx`** — define routes:

```
/login            → LoginPage
/register         → RegisterPage
/verify-email     → EmailVerificationPage
/invite/:token    → InviteAcceptPage  (public)
/                 → AuthGuard → BudgetListPage
/budgets/:id/*    → AuthGuard → AppShell → (sub-routes added in Task 13)
```

**`apps/web/src/components/auth/AuthGuard.tsx`**

- Uses `useSession()`
- While `isPending`: show full-page spinner
- No session: redirect to `/login` (preserve `?redirect=` param)
- Session exists: render children

### Auth pages

**`apps/web/src/pages/auth/LoginPage.tsx`**

- React Hook Form + Zod: `{ email: z.string().email(), password: z.string().min(1) }`
- Calls `signIn.email({ email, password })`
- On success: navigate to `redirect` query param or `/`
- On error: show inline error message from Better Auth response
- Link to `/register`
- "Forgot password?" link (placeholder — email reset via Better Auth)

**`apps/web/src/pages/auth/RegisterPage.tsx`**

- Fields: name, email, password
- Password strength indicator (4 criteria: length, uppercase, number, special char)
- Calls `signUp.email({ name, email, password })`
- On success: navigate to `/verify-email`
- Link to `/login`

**`apps/web/src/pages/auth/EmailVerificationPage.tsx`**

- Shows email address from router state or query param
- "Resend email" button — calls Better Auth resend endpoint
- 60s cooldown on resend button
- Link back to `/login`

## Steps

1. Install `better-auth` on web: `pnpm --filter web add better-auth`
2. Create `apps/web/src/lib/auth.ts`
3. Set up React Router in `main.tsx`
4. Create `router.tsx` with all routes
5. Build `AuthGuard` component
6. Build `LoginPage` — test sign-in end-to-end
7. Build `RegisterPage` — test sign-up + email verification flow
8. Build `EmailVerificationPage`
9. Verify redirect logic (unauthenticated → login → back to original route)

## Dependencies

- **Task 02** — Backend auth endpoints must be running

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: route structure, any Better Auth client config decisions, how to test the full auth flow manually
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE
