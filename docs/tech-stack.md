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

| Layer      | Technology               | Version         | Notes                               |
| ---------- | ------------------------ | --------------- | ----------------------------------- |
| Framework  | React                    | ^18.3.1         | StrictMode enabled                  |
| Build      | Vite                     | ^5.4.2          | HMR, proxies /api → backend         |
| Language   | TypeScript               | 5.6.3           | Strict mode                         |
| UI         | Material-UI (MUI)        | ^6.4.1          | Emotion styling engine              |
| Font       | Inter (via @fontsource)  | ^5.1.1          | 400/500/600 weights                 |
| Routing    | React Router             | ^6.26.1         | File-based page components          |
| Forms      | React Hook Form + Zod    | ^7.72.1         | `zodResolver` for validation        |
| API Client | Hono RPC (`hono/client`) | same as backend | End-to-end type safety, no code-gen |

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

### Better Auth over custom auth

Better Auth handles sessions, cookies, CSRF, and OAuth providers out of the box. No custom JWT management needed.

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
