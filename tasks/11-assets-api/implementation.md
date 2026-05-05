# Task 11 — Assets API: Implementation Notes

## Status: DONE

## Files Created

| File                                                                         | Purpose                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/api/src/domains/assets/entities/Asset.ts`                              | Asset entity with `valueAt(date)` compound growth method  |
| `apps/api/src/domains/assets/repositories/IAssetRepository.ts`               | Interface: findByBudget, findById, create, update, delete |
| `apps/api/src/domains/assets/usecases/GetAssetsUseCase.ts`                   | List assets for a budget                                  |
| `apps/api/src/domains/assets/usecases/CreateAssetUseCase.ts`                 | Create asset with member auth check                       |
| `apps/api/src/domains/assets/usecases/UpdateAssetUseCase.ts`                 | Update asset                                              |
| `apps/api/src/domains/assets/usecases/DeleteAssetUseCase.ts`                 | Delete asset                                              |
| `apps/api/src/domains/assets/schemas/asset.schema.ts`                        | Zod schemas for request/response                          |
| `apps/api/src/infrastructure/database/repositories/PrismaAssetRepository.ts` | Prisma implementation                                     |
| `apps/api/src/controllers/asset/AssetController.ts`                          | CRUD routes under `/api/budgets/:id/assets`               |

## Files Modified

| File                                  | Change                          |
| ------------------------------------- | ------------------------------- |
| `apps/api/src/config/di.container.ts` | Registered `IAssetRepository`   |
| `apps/api/src/app.ts`                 | Mounted `createAssetController` |

## API Endpoints

| Method | Path                           | Description     |
| ------ | ------------------------------ | --------------- |
| GET    | `/api/budgets/:id/assets`      | List all assets |
| POST   | `/api/budgets/:id/assets`      | Create asset    |
| PATCH  | `/api/budgets/:id/assets/:aid` | Update asset    |
| DELETE | `/api/budgets/:id/assets/:aid` | Delete asset    |

## Key Design: Asset.valueAt()

```
value(T) = currentValue × (1 + annualGrowthRate/100) ^ yearsElapsed
```

Guard: if `factor <= 0` (rate ≤ -100%), returns 0 immediately to avoid `Math.pow(negative, fractional) = NaN`. Floor at 0 via `Math.max`.

## Tests

Integration tests in `src/__tests__/integration/asset.test.ts`: 9 tests covering CRUD + auth checks + value projection.
