# Task 09 — Revenues API

## Status

`DONE`

## Description

Implement the Revenue domain. Simpler than Expenses — no sub-types. Revenues are recurring or one-time income entries optionally linked to a person and category.

## What to build

### Entity — `src/domains/revenues/entities/Revenue.ts`

### Repository interface — `src/domains/revenues/repositories/IRevenueRepository.ts`

Methods: `findById`, `findByBudget(budgetId)`, `create`, `update`, `delete`

### Use cases — `src/domains/revenues/usecases/`

- `CreateRevenueUseCase` — OWNER or EDITOR
- `UpdateRevenueUseCase` — OWNER or EDITOR
- `DeleteRevenueUseCase` — OWNER or EDITOR
- `ListRevenuesUseCase` — any member; accepts optional `personId` filter

### Zod schemas — `src/domains/revenues/schemas/revenue.schema.ts`

- `createRevenueSchema`: name, categoryId?, personId?, amount, frequency, frequencyValue?, startDate?, endDate?
- `updateRevenueSchema`: all optional

### Controller — `src/controllers/revenue/RevenueController.ts`

Mounted at `/api/budgets/:id/revenues`:

```
GET    /api/budgets/:id/revenues       → ListRevenuesUseCase  (query: ?personId=)
POST   /api/budgets/:id/revenues       → CreateRevenueUseCase
PATCH  /api/budgets/:id/revenues/:rid  → UpdateRevenueUseCase
DELETE /api/budgets/:id/revenues/:rid  → DeleteRevenueUseCase
```

### Frequency handling note

`frequencyValue` is required when `frequency` is `EVERY_X_MONTHS` or `EVERY_X_YEARS`. Enforce in Zod with `.refine()`.

## Steps

1. Create entity, repository interface, Prisma repository
2. Create all 4 use cases with tests
3. Create Zod schemas with frequency refine
4. Create controller with full OpenAPI docs
5. Register DI + mount routes
6. Test all CRUD endpoints via Scalar UI

## Dependencies

- **Task 04** — Budget membership auth check
- **Task 06** — Person FK
- **Task 07** — Category FK

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: files created, frequency validation approach
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
