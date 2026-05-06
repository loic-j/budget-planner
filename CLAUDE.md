# Budget Planner — Development Guide

## Project Overview

Personal finance planning app where users model revenues, expenses, assets, and liabilities to visualize net worth and cash flow projections over time. Budgets can be shared and co-edited.

**Tech Stack:**

- **Backend:** Hono (Node.js), TypeScript, Prisma + PostgreSQL
- **Frontend:** React 18, Vite, TypeScript, Material-UI (MUI) + MUI X DataGrid + MUI X Charts, React Hook Form + Zod
- **Auth:** Better Auth
- **API Documentation:** OpenAPI 3.1 with Scalar UI
- **Monorepo:** pnpm workspaces
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Observability:** Pino (logging), OpenTelemetry + Jaeger (tracing)
- **i18n:** react-i18next — English (default), Japanese, French; language saved in `localStorage` (`i18n-lang`)

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
pnpm test          # Unit + integration tests (Vitest)
pnpm test:e2e      # E2E tests (Playwright) — resets DB, seeds, runs all specs
```

---

## E2E Tests (Playwright)

### Overview

E2E tests live in `e2e/` and use Playwright. They test full user flows through the real UI — login, navigation, CRUD operations, error states.

- **Sequential only** — `workers: 1`, no concurrency. Tests share DB state and depend on each other.
- **DB reset before each run** — `pnpm test:e2e` runs `pnpm db:reset && pnpm db:seed` first.
- **Servers auto-started** — Playwright starts `dev:api` and `dev:web` automatically if not running.

### Commands

```bash
pnpm test:e2e           # Reset DB + seed + run all specs (headless)
pnpm test:e2e:headed    # Same but with browser visible (debugging)
pnpm test:e2e:report    # Open last run's HTML report
```

### Directory Structure

```
e2e/
  playwright.config.ts      # Config: workers=1, webServer, baseURL
  helpers/
    auth.ts                 # loginAs(page, user) helper
    seed-data.ts            # SEED constants (mirrors apps/api/prisma/seed.ts)
  specs/
    auth.spec.ts            # Auth flows (login, register, sign out)
    budget-list.spec.ts     # Budget list page
    budget-detail.spec.ts   # Budget detail, members tab, invite flows
```

### Seed Data

`apps/api/prisma/seed.ts` creates:

- **owner** — `seed@budget-planner.test` / `Seed1234!` — owns Seed Budget
- **member** — `member@budget-planner.test` / `Seed1234!` — VIEWER on Seed Budget
- **Seed Budget** — EUR budget with one active invite token (`seed-invite-editor`)

`e2e/helpers/seed-data.ts` exports `SEED` constants with the same values for use in tests.

### Policy for New Screens

When adding a new screen or feature:

1. **Update seed data** if the new screen needs existing data to test against — add to `apps/api/prisma/seed.ts` and mirror in `e2e/helpers/seed-data.ts`.
2. **Add a new spec file** `e2e/specs/<screen-name>.spec.ts` covering:
   - Happy path (golden path)
   - Validation/error cases
   - Navigation transitions in/out of the screen
3. **Re-run** `pnpm test:e2e` and fix all failures before marking the task done.

### Common Pitfalls

- **MUI Password label** — use `getByLabel('Password', { exact: true })` to avoid matching the eye-toggle button's `aria-label`.
- **MUI button accessible names** — icon buttons inherit title text; use `{ exact: true }` on role queries to avoid false matches.
- **Async data loading** — wait for visible elements before counting (e.g., wait for first copy button before counting invite rows).
- **Shared DB state** — tests run sequentially and accumulate state. Avoid assertions that break when DB has more rows than the seed.

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

## Charts & Time Series — Mandatory Rules

**Every chart/graph/time series MUST include all four of the following:**

1. **Date range filter** — From/To month pickers initialised from `budget.startDate`/`budget.endDate`
2. **Brush zoom** — Range `Slider` below the chart acting as a visual scrubber
3. **Granularity toggle** — Month / Year toggle to aggregate data
4. **Category filter** — Multi-select chip group when the data has a `categoryId` field (Expenses, Revenues, Savings)

Use the shared `ChartRangeBrush` component for all three:

```tsx
import { ChartRangeBrush } from '@/components/charts/ChartRangeBrush';
import type { ChartGranularity } from '@/components/charts/ChartRangeBrush';

// State (in the chart's parent component)
const [chartStart, setChartStart] = useState(() => budget.startDate.slice(0, 7));
const [chartEnd, setChartEnd] = useState(() => budget.endDate.slice(0, 7));
const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('monthly');

// Filter + aggregate (inline useMemo per chart)
const displayChart = useMemo(() => {
  const filtered = chartData.labels.map((l, i) => ({ l, i })).filter(({ l }) => l >= chartStart && l <= chartEnd);
  if (chartGranularity === 'monthly') return { labels: filtered.map(({ l }) => l), series: filtered.map(({ i }) => data[i]) };
  // yearly: group by label.slice(0,4), sum flows, take last value for balances
  ...
}, [chartData, chartStart, chartEnd, chartGranularity]);

// Render: place ChartRangeBrush directly below the chart, inside the same Box
<LineChart ... />
<ChartRangeBrush
  minMonth={budget.startDate.slice(0, 7)}
  maxMonth={budget.endDate.slice(0, 7)}
  startMonth={chartStart}
  endMonth={chartEnd}
  granularity={chartGranularity}
  onRangeChange={(s, e) => { setChartStart(s); setChartEnd(e); }}
  onGranularityChange={setChartGranularity}
/>
```

Use `ChartCategoryFilter` for charts with categorized data:

```tsx
import { ChartCategoryFilter } from '@/components/charts/ChartCategoryFilter';

// State
const [selectedChartCategories, setSelectedChartCategories] = useState<Set<string>>(new Set());

// Derive from source data (before chartData memo)
const hasUncategorized = useMemo(() => items.some((x) => !x.categoryId), [items]);
const filteredItems = useMemo(
  () =>
    selectedChartCategories.size === 0
      ? items
      : items.filter((x) => selectedChartCategories.has(x.categoryId ?? '')),
  [items, selectedChartCategories]
);
// pass filteredItems into computeChartData(...)

// Render: place between chart title and <LineChart>
<ChartCategoryFilter
  budgetId={budgetId}
  categories={categories} // already loaded in the tab
  selected={selectedChartCategories}
  hasUncategorized={hasUncategorized}
  onChange={setSelectedChartCategories}
  onCategoryChange={loadData} // reload categories after rename/delete
/>;
```

Empty `selected` Set = show all. Selecting one or more = show only those categories.

**Aggregation rules for yearly mode:**

- Cash flows (`revenue`, `expense`, `savingContribution`, `monthly`) → **sum** per year
- Balances/stocks (`netWorth`, `cashBalance`, `savingsBalance`, `assetValue`, `cumulative`) → **last value** per year

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

## Task Pairing Policy

When the user says "do next task" or similar, **always pair an API task with its corresponding frontend screen task** so the feature can be tested end-to-end:

| API task               | Frontend task         |
| ---------------------- | --------------------- |
| 09 — Revenues API      | 17 — Revenues Screen  |
| 10 — Savings API       | 18 — Savings Screen   |
| 11 — Assets API        | 19 — Assets Screen    |
| 12 — Projection Engine | 20 — Dashboard Screen |

**Do both in the same session:** build the API first, then wire up the frontend screen against it. Stop and report to the user once both are working end-to-end in the browser (Playwright smoke test or manual verification).

---

## Multilingual (i18n)

The app supports **English** (default), **Japanese**, and **French** via `react-i18next`.

- Translation files: `apps/web/src/locales/{en,ja,fr}/translation.json`
- Language detection order: `localStorage` (`i18n-lang`) → browser navigator
- i18n initialized in `apps/web/src/i18n.ts`, imported once in `main.tsx`

### Rules for new UI strings

1. **Never hardcode UI text** — always use `t('key')` from `useTranslation()`
2. **Sub-components** defined outside a parent must call `useTranslation()` themselves
3. **Static label arrays** (e.g. `singleSelect` valueOptions for DataGrid) must be computed inside `useMemo` with `t` in the dependency array so they update on language change:
   ```ts
   const FREQ_KEYS = ['MONTHLY', 'YEARLY'] as const;
   const freqOptions = useMemo(
     () => FREQ_KEYS.map((v) => ({ value: v, label: t(`freq.${v}`) })),
     [t]
   );
   ```
4. **Preset category names** — use the `useCatName` hook (`apps/web/src/hooks/useCatName.ts`) which translates via `t('cat.{type_lower}.{icon}')` with fallback to `cat.name`
5. **Add keys to all three locale files** (en, ja, fr) when adding new translatable strings

### Key translation namespaces

| Namespace      | Usage                                          |
| -------------- | ---------------------------------------------- |
| `common.*`     | Shared labels (Save, Cancel, Delete…)          |
| `nav.*`        | Sidebar navigation                             |
| `auth.*`       | Login, register, verify email pages            |
| `invite.*`     | Invite accept page                             |
| `profile.*`    | User profile page                              |
| `budgetList.*` | Budget list page                               |
| `settings.*`   | Budget settings + people management            |
| `expenses.*`   | Expenses tab                                   |
| `revenues.*`   | Revenues tab                                   |
| `savings.*`    | Savings tab                                    |
| `assets.*`     | Assets tab                                     |
| `members.*`    | Members page                                   |
| `dashboard.*`  | Dashboard page                                 |
| `cat.*`        | Preset category names (expense/revenue/saving) |
| `freq.*`       | Frequency enum labels                          |
| `loanType.*`   | Loan type enum labels                          |
| `assetType.*`  | Asset type enum labels                         |
| `personType.*` | Person type enum labels                        |
| `sex.*`        | Sex enum labels                                |
| `role.*`       | Budget role labels                             |
| `errors.*`     | Error messages with interpolation              |

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

**Last Updated:** 2026-05-06
**Phase:** Auth + Budget CRUD + Members/Invites + Full i18n (EN/JA/FR) complete
**Next:** Expenses, Revenues, Savings screens
