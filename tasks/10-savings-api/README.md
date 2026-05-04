# Task 10 — Savings API

## Status

`DONE`

## Description

Implement the Saving domain. Same structure as revenues but includes an optional `targetAmount` field used for goal-based savings tracking.

## What to build

### Entity — `src/domains/savings/entities/Saving.ts`

Include `targetAmount?: number` field.

### Repository interface — `src/domains/savings/repositories/ISavingRepository.ts`

Methods: `findById`, `findByBudget(budgetId)`, `create`, `update`, `delete`

### Use cases — `src/domains/savings/usecases/`

- `CreateSavingUseCase` — OWNER or EDITOR
- `UpdateSavingUseCase` — OWNER or EDITOR
- `DeleteSavingUseCase` — OWNER or EDITOR
- `ListSavingsUseCase` — any member; optional `personId` filter

### Zod schemas — `src/domains/savings/schemas/saving.schema.ts`

- `createSavingSchema`: name, categoryId?, personId?, amount, frequency, frequencyValue?, startDate?, endDate?, targetAmount?
- `updateSavingSchema`: all optional
- Frequency refine: `frequencyValue` required when `EVERY_X_MONTHS` or `EVERY_X_YEARS`

### Controller — `src/controllers/saving/SavingController.ts`

Mounted at `/api/budgets/:id/savings`:

```
GET    /api/budgets/:id/savings       → ListSavingsUseCase
POST   /api/budgets/:id/savings       → CreateSavingUseCase
PATCH  /api/budgets/:id/savings/:sid  → UpdateSavingUseCase
DELETE /api/budgets/:id/savings/:sid  → DeleteSavingUseCase
```

## Steps

1. Create entity, repository interface, Prisma repository
2. Create all 4 use cases with tests
3. Create Zod schemas
4. Create controller with full OpenAPI docs
5. Register DI + mount routes
6. Test CRUD + verify `targetAmount` is optional and stored correctly

## Dependencies

- **Task 04** — Budget membership auth check
- **Task 06** — Person FK
- **Task 07** — Category FK

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: files created, any decisions around targetAmount handling
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
