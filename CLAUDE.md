# Budget Planner — Development Guide

## Project Overview

Personal finance planning app where users model revenues, expenses, assets, and liabilities to visualize net worth and cash flow projections over time. Budgets can be shared and co-edited.

**Tech Stack:**

- **Backend:** Hono (Node.js), TypeScript, Prisma + PostgreSQL
- **Frontend:** React 18, Vite, TypeScript, Material-UI (MUI) + MUI X DataGrid + MUI X Charts, React Hook Form + Zod
- **Auth:** Better Auth
- **API Documentation:** OpenAPI 3.1 with Scalar UI
- **Monorepo:** pnpm workspaces
- **Testing:** Vitest
- **Observability:** Pino (logging), OpenTelemetry + Jaeger (tracing)

**Documentation:** See @docs/README.md for full doc index.

## Quick Start

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env   # edit BETTER_AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Frontend: http://localhost:5173 — Backend: http://localhost:3000/health

---

## Architecture

### Clean Architecture Layers

```
Controllers (HTTP) → Use Cases (Business Logic) → Repository Interfaces
                                                          ↑
                                         Infrastructure Implementations (Prisma)
```

1. **Domain layer is pure** — no external dependencies
2. **Dependencies point inward** — infrastructure depends on domain
3. **Use cases contain business logic** — controllers handle HTTP only

- @docs/architecture/clean-architecture.md — layer rules and 9-step feature pattern
- @docs/architecture/data-model.md — full DB schema

---

## 🚨 Critical Development Requirements

### 1. Stop All Processes After Every Task

After ANY task, stop all running dev servers:

```bash
pnpm kill   # or Ctrl+C in terminal
```

**Why:** prevents port conflicts, resource leaks, and confusion about what code is running.

### 2. Lint + Typecheck After Every Code Change

```bash
pnpm lint:fix && pnpm typecheck
```

Fix all TypeScript errors before proceeding. Never leave type errors unresolved.

### 3. Run Tests Before Completing Tasks

```bash
pnpm test
```

---

## Adding a New Feature — 9-Step Pattern

1. **Entity** — `src/domains/<feature>/entities/<Feature>.ts`
2. **Repository interface** — `src/domains/<feature>/repositories/I<Feature>Repository.ts`
3. **Use case** — `src/domains/<feature>/usecases/<Action><Feature>UseCase.ts`
4. **Prisma repo** — `src/infrastructure/database/repositories/Prisma<Feature>Repository.ts`
5. **Zod schemas** — `src/domains/<feature>/schemas/<feature>.schema.ts`
6. **Controller** — `src/controllers/<feature>/<Feature>Controller.ts`
7. **DI registration** — wire in `src/config/di.container.ts`
8. **Mount routes** — `.route('/api/<features>', ...)` in `src/app.ts`
9. **Frontend** — consume via `apiClient.<feature>.$get/post/...`

Full examples: @docs/architecture/clean-architecture.md

---

## Code Style Quick Reference

**TypeScript:**

- `.js` extensions in imports (ESM required)
- Named exports preferred — default exports only for React page components
- `import type` for type-only imports
- **No `as any`** — use proper types, generics, or type guards
- **No `as unknown`** to force compatibility — fix the schema/type mismatch
- **No `.toJSON()`** — return typed objects directly for Hono RPC type safety

**OpenAPI:**

- Use `OpenAPIHono` instead of `Hono`
- Define schemas in `domains/*/schemas/`
- Use `createRoute()` for all route definitions
- Document every endpoint

**Dependency Injection:**

- Always `@injectable()` on classes, `@inject()` on constructor params
- Register in `src/config/di.container.ts`

**Database:**

- Repository pattern always — never Prisma directly in use cases
- Prisma conventions: `snake_case` columns, `cuid()` IDs
- Map infrastructure errors to domain errors in the repository

Full reference: @docs/development/code-conventions.md

---

## Frontend Theme Quick Reference

**Full design system:** @docs/design-system.md — MUI theme config, color tokens, component patterns, and live HTML examples in `./design/`.

- Font: **Inter** (400/500/600 weights via @fontsource/inter)
- Primary color: **Teal `#009688`** — not the MUI default blue
- Dark mode only: bg `#121212`, paper `#1e1e1e`
- Forms: React Hook Form + Zod (`zodResolver`)
- Always use theme tokens, never hardcode colors:

```tsx
// ✅
<Box sx={{ bgcolor: 'background.paper', color: 'text.primary' }} />
// ❌
<Box sx={{ bgcolor: '#1e1e1e', color: '#fff' }} />
```

Key visual rules from the design system:

- Positive monetary values → `color: 'success.main'`
- Negative monetary values → `color: 'error.main'`
- Unsaved/dirty DataGrid rows → 3px left border `warning.main`
- Active sidebar item → 3px left border `primary.main` + `primary-a12` bg tint
- Numbers in tables → `fontVariantNumeric: 'tabular-nums'`

---

## API & Docs

- **API Docs:** http://localhost:3000/api/docs (Scalar UI)
- **OpenAPI spec:** http://localhost:3000/api/openapi.json

---

## Environment Variables

**`apps/api/.env`:**

```env
DATABASE_URL=postgresql://budget_user:budget_pass@localhost:5432/budget_planner
PORT=3000
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**`apps/web/.env`:** Leave `VITE_API_URL` empty in dev (Vite proxy handles it).

---

## Common Commands

```bash
pnpm dev              # Both backend and frontend
pnpm dev:api          # Backend only (port 3000)
pnpm dev:web          # Frontend only (port 5173)
pnpm db:migrate       # Run migrations
pnpm db:studio        # Prisma Studio
pnpm lint:fix         # Auto-fix formatting/linting
pnpm typecheck        # Verify TypeScript types
pnpm test             # Unit tests
docker compose up -d  # Start PostgreSQL + Jaeger
docker compose down   # Stop services
```

---

## Important URLs

| Service    | URL                            |
| ---------- | ------------------------------ |
| Frontend   | http://localhost:5173          |
| Backend    | http://localhost:3000          |
| API Docs   | http://localhost:3000/api/docs |
| Jaeger UI  | http://localhost:16687         |
| PostgreSQL | localhost:5432                 |

---

## What NOT to Do

1. ❌ Prisma directly in use cases → ✅ repository pattern
2. ❌ Business logic in controllers → ✅ use cases
3. ❌ Catch errors in controllers → ✅ global error handler
4. ❌ Default exports (non-page) → ✅ named exports
5. ❌ Skip Zod validation → ✅ always validate input
6. ❌ Undocumented endpoints → ✅ `createRoute()` with OpenAPI
7. ❌ `as any` / `as unknown` → ✅ fix the type
8. ❌ `.toJSON()` workarounds → ✅ return typed objects
9. ❌ **Skip lint/typecheck** → ✅ **always run after code changes**
10. ❌ **Leave processes running** → ✅ **stop all servers when done**
11. ❌ Deviate from design system → ✅ follow @docs/design-system.md (teal primary, dark tokens, component patterns)

---

**Last Updated:** 2026-05-03
**Phase:** POC — Hello World end-to-end (backend + frontend wired)
**Next:** Authentication flows, budget CRUD
