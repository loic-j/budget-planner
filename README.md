# Budget Planner

Personal finance planning app — model revenues, expenses, assets, and liabilities to visualize net worth and cash flow projections over time. Budgets can be shared and co-edited.

---

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Backend  | [Hono](https://hono.dev) · TypeScript · Node.js   |
| Database | PostgreSQL · [Prisma ORM](https://prisma.io)      |
| Frontend | React 18 · Vite · TypeScript                      |
| UI       | Material-UI (MUI) · MUI X DataGrid · MUI X Charts |
| Forms    | React Hook Form · Zod                             |
| Auth     | [Better Auth](https://better-auth.com)            |
| API Docs | OpenAPI 3.1 · Scalar UI                           |
| Monorepo | pnpm workspaces                                   |
| Testing  | Vitest (unit/integration) · Playwright (E2E)      |
| Tracing  | OpenTelemetry · Jaeger                            |
| i18n     | react-i18next — English · Japanese · French       |

---

## Project Structure

```
budget-planner/
├── apps/
│   ├── api/          # Hono backend (clean architecture)
│   └── web/          # React frontend
├── e2e/              # Playwright end-to-end tests
├── infra/            # Terraform infrastructure
├── docs/             # Architecture, data model, design system docs
├── design/           # Live HTML component examples
└── docker-compose.yml
```

---

## Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io) ≥ 9
- Docker + Docker Compose

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL + Jaeger
docker compose up -d postgres jaeger

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set BETTER_AUTH_SECRET (openssl rand -base64 32)

# 4. Run database migrations + seed
pnpm db:migrate
pnpm db:seed

# 5. Start dev servers
pnpm dev
```

| Service   | URL                            |
| --------- | ------------------------------ |
| Frontend  | http://localhost:5173          |
| Backend   | http://localhost:3000          |
| API Docs  | http://localhost:3000/api/docs |
| Jaeger UI | http://localhost:16687         |

---

## Environment Variables

**`apps/api/.env`**

```env
DATABASE_URL=postgresql://budget_user:budget_pass@localhost:5432/budget_planner
PORT=3000
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**`apps/web/.env`** — leave `VITE_API_URL` empty in dev (Vite proxy handles it).

---

## Common Commands

```bash
# Development
pnpm dev              # Start both frontend + backend
pnpm dev:api          # Backend only (port 3000)
pnpm dev:web          # Frontend only (port 5173)
pnpm kill             # Stop all dev servers

# Database
pnpm db:migrate       # Run pending migrations
pnpm db:seed          # Seed with test data
pnpm db:reset         # Drop + recreate + seed
pnpm db:studio        # Prisma Studio GUI

# Code quality
pnpm lint:fix         # Auto-fix linting + formatting
pnpm typecheck        # TypeScript type check

# Testing
pnpm test             # Unit + integration tests (Vitest)
pnpm test:e2e         # E2E tests — resets DB, seeds, runs all specs
pnpm test:e2e:headed  # E2E with visible browser (debugging)
pnpm test:e2e:report  # Open last Playwright HTML report

# Production
pnpm build:prod       # Build frontend + backend
docker compose up --build -d  # Full stack in Docker
```

---

## Architecture

Clean Architecture with strict layer separation:

```
HTTP Request → Controllers → Use Cases → Repository Interfaces
                                                ↑
                                    Prisma Repositories (Infrastructure)
```

- **Domain layer** — pure TypeScript, zero external dependencies
- **Use cases** — all business logic
- **Controllers** — HTTP adapters only (parse request → call use case → return response)
- **Repositories** — Prisma implementations behind domain interfaces

Full details: [docs/architecture/clean-architecture.md](docs/architecture/clean-architecture.md)

---

## Key Features

- **Dashboard** — monthly / yearly net worth and cash flow projections over a configurable date range
- **Expenses** — regular recurring costs + full loan amortization (mortgage, car loan, etc.)
- **Revenues** — income streams per person or household
- **Savings** — contribution tracking with optional goal targets
- **Assets** — real estate, investments, vehicles with annual growth rate
- **Sharing** — invite collaborators as EDITOR or VIEWER via token link
- **i18n** — English, Japanese, French; auto-detected from browser

---

## Testing

**Seed credentials** (after `pnpm db:seed`):

| User   | Email                        | Password    | Role   |
| ------ | ---------------------------- | ----------- | ------ |
| Owner  | `seed@budget-planner.test`   | `Seed1234!` | OWNER  |
| Member | `member@budget-planner.test` | `Seed1234!` | VIEWER |

E2E tests run sequentially (shared DB state). See [e2e/](e2e/) for specs.

---

## Documentation

| Doc                                                                                | Description                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------- |
| [docs/architecture/clean-architecture.md](docs/architecture/clean-architecture.md) | Layer rules, DI, 9-step feature pattern     |
| [docs/architecture/data-model.md](docs/architecture/data-model.md)                 | Full DB schema and entity relationships     |
| [docs/development/code-conventions.md](docs/development/code-conventions.md)       | TypeScript rules, patterns, anti-patterns   |
| [docs/design-system.md](docs/design-system.md)                                     | MUI theme, color tokens, component patterns |
| [docs/business/requirements.md](docs/business/requirements.md)                     | Feature specs and domain rules              |
| [docs/screens/README.md](docs/screens/README.md)                                   | Screen inventory and navigation flow        |
| [design/index.html](design/index.html)                                             | Live component examples (open in browser)   |

---

## License

Private — all rights reserved.
