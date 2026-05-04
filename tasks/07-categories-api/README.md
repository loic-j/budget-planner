# Task 07 — Categories API + Preset Seeding

## Status

`DONE`

## Description

Implement the Category domain. Categories are scoped per budget. System presets are defined as a hardcoded constant and seeded into every new budget at creation time. Users can add, rename, or delete categories after that.

## What to build

### Preset constant (created in Task 01)

`apps/api/src/domains/categories/constants/presetCategories.ts` — array of `{ name, icon, type, isPreset: true }` covering all presets from `docs/architecture/data-model.md`.

### Entity — `src/domains/categories/entities/Category.ts`

### Repository interface — `src/domains/categories/repositories/ICategoryRepository.ts`

Methods: `findById`, `findByBudget(budgetId, type?)`, `create`, `update`, `delete`, `bulkCreate`

### Use cases — `src/domains/categories/usecases/`

- `ListCategoriesUseCase` — any budget member; accepts optional `type` filter
- `CreateCategoryUseCase` — OWNER or EDITOR only
- `UpdateCategoryUseCase` — OWNER or EDITOR only
- `DeleteCategoryUseCase` — OWNER or EDITOR only; if category is in use (linked to an expense/revenue/saving), set those `categoryId` to null (do not block delete)
- `SeedPresetCategoriesUseCase` — called internally by `CreateBudgetUseCase`; bulk-creates all preset rows for a new budget using `bulkCreate`

### Zod schemas — `src/domains/categories/schemas/category.schema.ts`

- `createCategorySchema`: name, icon, type (EXPENSE | REVENUE | SAVING)
- `updateCategorySchema`: name?, icon?

### Controller — `src/controllers/category/CategoryController.ts`

Mounted at `/api/budgets/:id/categories`:

```
GET    /api/budgets/:id/categories       → ListCategoriesUseCase  (query: ?type=EXPENSE)
POST   /api/budgets/:id/categories       → CreateCategoryUseCase
PATCH  /api/budgets/:id/categories/:cid  → UpdateCategoryUseCase
DELETE /api/budgets/:id/categories/:cid  → DeleteCategoryUseCase
```

### Wire into budget creation

Update `CreateBudgetUseCase` (Task 04) to call `SeedPresetCategoriesUseCase` after creating the budget. The `TODO` comment added in Task 04 must be replaced with the actual call.

## Steps

1. Confirm preset constants file exists (Task 01 output)
2. Create entity, repository interface, Prisma repository
3. Create all use cases with tests
4. Create Zod schemas
5. Create controller with full OpenAPI docs
6. Register DI + mount routes
7. Update `CreateBudgetUseCase` to call `SeedPresetCategoriesUseCase`
8. Test: create a budget → verify preset categories appear in `GET /api/budgets/:id/categories`

## Dependencies

- **Task 01** — Preset constants file and Category table in schema
- **Task 04** — `CreateBudgetUseCase` must be updated to call seeding

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: preset list used, how seeding integrates with budget creation, delete behaviour when category is in use
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
