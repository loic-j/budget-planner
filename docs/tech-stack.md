# Tech Stack

## Overview

Full-stack TypeScript monorepo (pnpm workspaces). Backend and frontend share types via Hono RPC — no manual type duplication.

---

## Backend — `apps/api`

| Layer      | Technology                    | Version | Notes                                 |
| ---------- | ----------------------------- | ------- | ------------------------------------- |
| Framework  | [Hono](https://hono.dev)      | ^4.5.8  | Lightweight, edge-ready, built-in RPC |
| Runtime    | Node.js + `@hono/node-server` | ^1.12.0 | Dev via `@hono/vite-dev-server`       |
| Language   | TypeScript                    | 5.6.3   | Strict mode, ESM only                 |
| ORM        | Prisma                        | ^5.18.0 | Type-safe DB access                   |
| Database   | PostgreSQL                    | 17      | Via Docker in dev                     |
| Auth       | Better Auth                   | ^1.0.7  | Sessions, OAuth-ready                 |
| Validation | Zod + `@hono/zod-openapi`     | ^4.3.6  | Runtime + OpenAPI 3.1 generation      |
| API Docs   | Scalar UI                     | ^0.10.5 | Auto-generated from Zod schemas       |
| DI         | tsyringe                      | ^4.8.0  | Decorator-based IoC container         |
| Logging    | Pino                          | ^9.3.2  | Structured JSON, pretty in dev        |
| Tracing    | OpenTelemetry + Jaeger        | ^1.9.0  | Distributed traces                    |
| Testing    | Vitest                        | ^2.0.5  | Unit tests for use cases / entities   |

---

## Frontend — `apps/web`

| Layer      | Technology               | Version         | Notes                                                                                                        |
| ---------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework  | React                    | ^18.3.1         | StrictMode enabled                                                                                           |
| Build      | Vite                     | ^5.4.2          | HMR, proxies /api → backend                                                                                  |
| Language   | TypeScript               | 5.6.3           | Strict mode                                                                                                  |
| UI         | Material-UI (MUI)        | ^6.4.1          | Emotion styling engine                                                                                       |
| Font       | Inter (via @fontsource)  | ^5.1.1          | 400/500/600 weights                                                                                          |
| Routing    | React Router             | ^6.26.1         | File-based page components                                                                                   |
| Forms      | React Hook Form + Zod    | ^7.72.1         | `zodResolver` for validation                                                                                 |
| Charts     | MUI X Charts             | ^7.x            | `@mui/x-charts` — LineChart, BarChart, PieChart — auto-syncs MUI theme and dark mode, no manual color wiring |
| Data Grid  | MUI X DataGrid           | ^7.x            | `@mui/x-data-grid` free tier — inline row editing for bulk expense/revenue entry                             |
| API Client | Hono RPC (`hono/client`) | same as backend | End-to-end type safety, no code-gen                                                                          |

---

## Infrastructure

| Tool              | Purpose                            |
| ----------------- | ---------------------------------- |
| pnpm workspaces   | Monorepo: `apps/*`, `packages/*`   |
| Docker Compose    | PostgreSQL 17 + Jaeger (local dev) |
| ESLint + Prettier | Linting and formatting             |
| Git + GitHub      | Version control                    |

---

## Key Design Decisions

### Hono RPC for type-safe API calls

The frontend imports `AppType` from `apps/api/src/app.ts` and uses `hc<AppType>()`. Changes to backend routes and schemas are immediately reflected as TypeScript errors on the frontend — no Swagger codegen, no manual type maintenance.

### Clean Architecture

Business logic lives in domain use cases. Controllers are thin HTTP adapters. Prisma repositories implement domain interfaces. This makes use cases testable in isolation without a database.

### Better Auth — implementation pattern

Better Auth handles sessions, cookies, CSRF, and OAuth providers out of the box. No custom JWT management needed.

**Same pattern as `apps/prono`** — copy that project's auth wiring exactly.

#### Backend (`apps/api`)

`src/config/auth.ts` — create auth instance:

```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

export function createAuthInstance(prisma: PrismaClient) {
  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // budget-planner requires email verify
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
      process.env.FRONTEND_URL,
      process.env.BETTER_AUTH_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean) as string[],
    user: {
      additionalFields: {
        role: { type: 'string', required: false, input: false, returned: true },
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuthInstance>;
```

`src/types/hono.ts` — typed Hono context:

```typescript
import type { AuthInstance } from '../config/auth.js';

export type BetterAuthUser = AuthInstance['$Infer']['Session']['user'];
export type BetterAuthSession = AuthInstance['$Infer']['Session']['session'];

export type AppEnv = {
  Variables: { user: BetterAuthUser; session: BetterAuthSession };
};
```

`src/middleware/auth.middleware.ts` — protect routes:

```typescript
export function createAuthMiddleware(auth: AuthInstance) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) throw new UnauthorizedError('Authentication required');
    c.set('user', session.user);
    c.set('session', session.session);
    await next();
  });
}
```

`src/app.ts` — mount auth handler:

```typescript
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
```

#### Frontend (`apps/web`)

`src/lib/auth.ts` — auth client:

```typescript
import { createAuthClient } from 'better-auth/react';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const authClient = createAuthClient({
  baseURL: apiBaseURL,
  fetchOptions: { credentials: 'include' },
});

export const { useSession, signIn, signUp, signOut } = authClient;
```

Usage in components:

```typescript
const { data: session, isPending } = useSession();

// Sign in
await signIn.email({ email, password });

// Sign up
await signUp.email({ email, password, name });

// Sign out
await signOut();
```

#### Environment variables

```env
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Zod as single source of truth

Zod schemas validate runtime input AND generate OpenAPI 3.1 documentation via `@hono/zod-openapi`. One schema serves both purposes.

---

## Ports (local dev)

| Service           | URL                                    | Port  |
| ----------------- | -------------------------------------- | ----- |
| Frontend          | http://localhost:5173                  | 5173  |
| Backend API       | http://localhost:3000                  | 3000  |
| API Docs (Scalar) | http://localhost:3000/api/docs         | 3000  |
| OpenAPI JSON      | http://localhost:3000/api/openapi.json | 3000  |
| Jaeger UI         | http://localhost:16687                 | 16687 |
| PostgreSQL        | localhost:5432                         | 5432  |
