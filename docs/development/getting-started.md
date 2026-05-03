# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL + Jaeger
docker compose up -d

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set BETTER_AUTH_SECRET to a random 32-byte value:
# openssl rand -base64 32

# 4. Run DB migrations
pnpm db:migrate

# 5. Start dev servers
pnpm dev
```

**Verify:**

- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health
- API Docs: http://localhost:3000/api/docs

## Environment Variables

### `apps/api/.env`

```env
DATABASE_URL=postgresql://budget_user:budget_pass@localhost:5432/budget_planner
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=http://localhost:5173
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4319/v1/traces
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
```

### `apps/web/.env`

Leave `VITE_API_URL` empty in dev — Vite proxies `/api` to `localhost:3000`.

```env
VITE_API_URL=
```

## Common Commands

```bash
pnpm dev              # Both servers in parallel
pnpm dev:api          # Backend only (port 3000)
pnpm dev:web          # Frontend only (port 5173)

pnpm db:migrate       # Prisma migrate dev
pnpm db:studio        # Prisma Studio (port 5555)
pnpm db:reset         # Reset DB (dev only)

pnpm lint:fix         # ESLint + Prettier auto-fix
pnpm typecheck        # TypeScript validation (both apps)

pnpm test             # All unit tests

docker compose up -d  # Start PostgreSQL + Jaeger
docker compose down   # Stop services
```

## After Every Code Change

```bash
pnpm lint:fix && pnpm typecheck
```

**Fix all typecheck errors before proceeding.**
