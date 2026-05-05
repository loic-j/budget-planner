# Task 02 — Better Auth Backend Setup

## Status

`DONE`

## Description

Wire Better Auth into the Hono API. Identical pattern to `apps/prono` — session-based auth with Prisma adapter, email/password enabled, email verification required.

## What to build

### Files to create

**`apps/api/src/config/auth.ts`**

```typescript
export function createAuthInstance(prisma: PrismaClient) { ... }
export type AuthInstance = ReturnType<typeof createAuthInstance>;
```

- Prisma adapter, postgresql provider
- `emailAndPassword.enabled: true`, `requireEmailVerification: true`
- Session: 7 days expiry, 1 day update age
- Trusted origins from `FRONTEND_URL`, `BETTER_AUTH_URL`, localhost
- Additional user field: `role` (string, input: false, returned: true)

**`apps/api/src/types/hono.ts`**

```typescript
export type BetterAuthUser = AuthInstance['$Infer']['Session']['user'];
export type BetterAuthSession = AuthInstance['$Infer']['Session']['session'];
export type AppEnv = { Variables: { user: BetterAuthUser; session: BetterAuthSession } };
```

**`apps/api/src/middleware/auth.middleware.ts`**

```typescript
export function createAuthMiddleware(auth: AuthInstance) { ... }
```

- Calls `auth.api.getSession({ headers: c.req.raw.headers })`
- Throws `UnauthorizedError` if no session
- Sets `c.set('user', ...)` and `c.set('session', ...)`

### Files to modify

**`apps/api/src/app.ts`**

- Mount auth handler: `app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))`
- Add CORS middleware with `credentials: true`, `origin: FRONTEND_URL`

**`apps/api/src/config/di.container.ts`**

- Register `AuthInstance` in container

**`apps/api/.env.example`**

- Ensure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL` are documented

## Steps

1. Install `better-auth` if not already present (`pnpm --filter api add better-auth`)
2. Create `auth.ts` config — mirror prono exactly, set `requireEmailVerification: true`
3. Create `types/hono.ts` with `AppEnv`
4. Create `auth.middleware.ts`
5. Update `app.ts` to mount auth routes and configure CORS
6. Test with `curl` or Scalar UI: `POST /api/auth/sign-up/email`

## Dependencies

- **Task 01** — Prisma schema must exist (Better Auth needs `User`, `Session`, `Account`, `Verification` tables)

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `DONE` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: packages installed, files created, how to test auth manually
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE
