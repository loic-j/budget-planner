# Task 11 — Assets API

## Status

`DONE`

## Description

Implement the Asset domain. Assets represent things the user owns (real estate, investments, vehicles). Each has a current value, acquisition date, and annual growth rate. Optionally linked to a LoanDetail.

## What to build

### Entity — `src/domains/assets/entities/Asset.ts`

```typescript
export class Asset {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly type: AssetType,
    public readonly name: string,
    public readonly currentValue: number,
    public readonly acquisitionDate: Date,
    public readonly annualGrowthRate: number, // % — negative = depreciation
    public readonly loanDetailId?: string
  ) {}

  valueAt(date: Date): number {
    const years = differenceInYears(date, this.acquisitionDate);
    return Math.max(0, this.currentValue * Math.pow(1 + this.annualGrowthRate / 100, years));
  }
}
```

### Repository interface — `src/domains/assets/repositories/IAssetRepository.ts`

Methods: `findById`, `findByBudget(budgetId)`, `create`, `update`, `delete`

### Use cases — `src/domains/assets/usecases/`

- `CreateAssetUseCase` — OWNER or EDITOR
- `UpdateAssetUseCase` — OWNER or EDITOR
- `DeleteAssetUseCase` — OWNER or EDITOR
- `ListAssetsUseCase` — any member

### Zod schemas — `src/domains/assets/schemas/asset.schema.ts`

- `createAssetSchema`: name, type, currentValue (positive), acquisitionDate, annualGrowthRate (any number), loanDetailId?
- `updateAssetSchema`: all optional

### Controller — `src/controllers/asset/AssetController.ts`

Mounted at `/api/budgets/:id/assets`:

```
GET    /api/budgets/:id/assets       → ListAssetsUseCase
POST   /api/budgets/:id/assets       → CreateAssetUseCase
PATCH  /api/budgets/:id/assets/:aid  → UpdateAssetUseCase
DELETE /api/budgets/:id/assets/:aid  → DeleteAssetUseCase
```

## Steps

1. Create entity with `valueAt(date)` method
2. Create repository interface, Prisma repository
3. Create all 4 use cases with tests
4. Create Zod schemas
5. Create controller
6. Register DI + mount routes
7. Test: create vehicle with -12% growth rate, verify `valueAt` floors at 0

## Dependencies

- **Task 04** — Budget membership auth check
- **Task 08** — `loanDetailId` FK (optional) — validate loan belongs to same budget

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: valueAt formula, floor at 0 for depreciated assets, loanDetailId cross-budget validation
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
