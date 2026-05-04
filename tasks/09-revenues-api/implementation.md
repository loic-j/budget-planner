# Task 09 — Implementation Notes

## Files created

- `src/domains/revenues/entities/Revenue.ts` — Revenue entity with Frequency type
- `src/domains/revenues/repositories/IRevenueRepository.ts` — CRUD interface with optional personId filter
- `src/domains/revenues/usecases/ListRevenuesUseCase.ts` — any member; optional `personId` query param
- `src/domains/revenues/usecases/CreateRevenueUseCase.ts` — OWNER or EDITOR only
- `src/domains/revenues/usecases/UpdateRevenueUseCase.ts` — OWNER or EDITOR; verifies revenue belongs to budget
- `src/domains/revenues/usecases/DeleteRevenueUseCase.ts` — OWNER or EDITOR; verifies revenue belongs to budget
- `src/domains/revenues/schemas/revenue.schema.ts` — Zod schemas with frequency refine
- `src/infrastructure/database/repositories/PrismaRevenueRepository.ts` — Prisma implementation
- `src/controllers/revenue/RevenueController.ts` — OpenAPI controller, mounted at `/api/budgets`
- `src/__tests__/integration/revenue.test.ts` — 9 integration tests

## Frequency validation approach

`createRevenueSchema` uses `.refine()` to enforce that `frequencyValue` is present if and only if
`frequency` is `EVERY_X_MONTHS` or `EVERY_X_YEARS`:

```typescript
.refine(
  (v) =>
    (v.frequency === 'EVERY_X_MONTHS' || v.frequency === 'EVERY_X_YEARS') ===
    (v.frequencyValue !== undefined),
  { message: 'frequencyValue required for EVERY_X_MONTHS / EVERY_X_YEARS', path: ['frequencyValue'] }
)
```

## Test gotcha

Integration tests must register `ICategoryRepository` and `IPersonRepository` even if not directly
used by revenues — `CreateBudgetUseCase` calls `seedCategories.execute()` which resolves
`ICategoryRepository`. Missing it causes budget creation to fail silently (budgetId is undefined),
making all subsequent member checks return 403.
