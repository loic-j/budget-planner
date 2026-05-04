# Task 04 — Budget CRUD API

## Status

`IN_PROGRESS`

## Description

Implement the Budget domain following the 9-step clean architecture pattern. Covers creating, reading, updating, and deleting budgets, plus listing budgets for the current user.

## What to build

Follow `docs/architecture/clean-architecture.md` — 9-step pattern.

### 1. Entity — `src/domains/budget/entities/Budget.ts`

```typescript
export class Budget {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly currency: string,
    public readonly initialSaving: number,
    public readonly description?: string
  ) {}
}
```

### 2. Repository interface — `src/domains/budget/repositories/IBudgetRepository.ts`

Methods: `findById`, `findByMember(userId)`, `create`, `update`, `delete`

### 3. Use cases — `src/domains/budget/usecases/`

- `CreateBudgetUseCase` — creates budget + adds creator as `OWNER` BudgetMember
- `GetBudgetUseCase` — fetches by id, checks caller is a member
- `ListUserBudgetsUseCase` — returns all budgets where user is a BudgetMember
- `UpdateBudgetUseCase` — requires OWNER or EDITOR role; EDITOR cannot change name/dates/currency
- `DeleteBudgetUseCase` — requires OWNER role

### 4. Prisma repository — `src/infrastructure/database/repositories/PrismaBudgetRepository.ts`

### 5. Zod schemas — `src/domains/budget/schemas/budget.schema.ts`

- `createBudgetSchema`: name, startDate, endDate, currency, initialSaving?, description?
- `updateBudgetSchema`: all fields optional
- `budgetResponseSchema`: full budget shape for API response

### 6. Controller — `src/controllers/budget/BudgetController.ts`

Routes (all require auth middleware):

```
GET    /api/budgets          → ListUserBudgetsUseCase
POST   /api/budgets          → CreateBudgetUseCase
GET    /api/budgets/:id      → GetBudgetUseCase
PATCH  /api/budgets/:id      → UpdateBudgetUseCase
DELETE /api/budgets/:id      → DeleteBudgetUseCase
```

All routes use `createRoute()` with full OpenAPI docs.

### 7. DI registration — `src/config/di.container.ts`

Register `IBudgetRepository` → `PrismaBudgetRepository`.

### 8. Mount routes — `src/app.ts`

`.route('/api/budgets', budgetController)`

### 9. Note on category seeding

`CreateBudgetUseCase` must call `SeedPresetCategoriesUseCase` (Task 07) after creating the budget. Add a `TODO` comment for now — wire it in Task 07.

## Steps

1. Create entity
2. Create repository interface
3. Create all 5 use cases with tests (`*.test.ts` alongside each use case)
4. Create Prisma repository
5. Create Zod schemas
6. Create controller with `createRoute()` for each endpoint
7. Register in DI + mount in app.ts
8. Manual test via Scalar UI at `http://localhost:3000/api/docs`

## Dependencies

- **Task 01** — Prisma schema
- **Task 02** — Auth middleware (all routes protected)

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: files created, use case list, any domain rule decisions
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
