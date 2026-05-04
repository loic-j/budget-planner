# Task 07 — Implementation Notes

## Files created

- `src/domains/categories/entities/Category.ts`
- `src/domains/categories/repositories/ICategoryRepository.ts` — includes `bulkCreate(budgetId, items)`
- `src/domains/categories/usecases/ListCategoriesUseCase.ts` — any member; optional `type` filter passed to repo
- `src/domains/categories/usecases/CreateCategoryUseCase.ts` — OWNER/EDITOR; forces `isPreset: false`
- `src/domains/categories/usecases/UpdateCategoryUseCase.ts` — OWNER/EDITOR
- `src/domains/categories/usecases/DeleteCategoryUseCase.ts` — OWNER/EDITOR
- `src/domains/categories/usecases/SeedPresetCategoriesUseCase.ts` — called by `CreateBudgetUseCase`
- `src/infrastructure/database/repositories/PrismaCategoryRepository.ts` — `bulkCreate` uses `createMany`; ordered by `is_preset DESC, created_at ASC`
- `src/domains/categories/schemas/category.schema.ts`
- `src/controllers/category/CategoryController.ts` — `?type=` query param on list route

## Preset list

22 presets defined in `src/domains/categories/constants/presetCategories.ts`:

- 14 EXPENSE categories (Food, Housing, Transportation, Entertainment, Health, Personal care, Travel, Gift, 4× Education, University, Other)
- 5 REVENUE categories (Salary, Freelance, Pension, Unemployment benefit, Other)
- 3 SAVING categories (Emergency fund, Retirement, Other)

## Seeding integration

`CreateBudgetUseCase` injects `SeedPresetCategoriesUseCase` via `@inject(SeedPresetCategoriesUseCase)` (class reference, not string token). After `repo.create(data)`, it calls `seedCategories.execute(budget.id)`. This uses `prisma.category.createMany` for a single round-trip.

## Delete behaviour

`DeleteCategoryUseCase` calls `categoryRepo.delete(categoryId)`. The Prisma schema has `onDelete: SetNull` on the `categoryId` FK in `Expense`, `Revenue`, and `Saving`. Linked rows keep their data; `categoryId` becomes null.

## Tests

- 9 unit tests in `src/__tests__/unit/domains/categories/usecases/CategoryUseCases.test.ts`
- 8 integration tests in `src/__tests__/integration/category.test.ts`

Integration tests verified: budget creation seeds all 22 presets; type filter works; custom CRUD works; count returns to 22 after delete; 404 on unknown category.
