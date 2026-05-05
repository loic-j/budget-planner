# Task 10 — Savings API: Implementation Notes

## Status: DONE

## Files Created

| File                                                                          | Purpose                                                   |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/api/src/domains/savings/entities/Saving.ts`                             | Saving entity with frequency/date fields                  |
| `apps/api/src/domains/savings/repositories/ISavingRepository.ts`              | Interface: findByBudget, findById, create, update, delete |
| `apps/api/src/domains/savings/usecases/GetSavingsUseCase.ts`                  | List savings for a budget                                 |
| `apps/api/src/domains/savings/usecases/CreateSavingUseCase.ts`                | Create saving with member auth check                      |
| `apps/api/src/domains/savings/usecases/UpdateSavingUseCase.ts`                | Update saving                                             |
| `apps/api/src/domains/savings/usecases/DeleteSavingUseCase.ts`                | Delete saving                                             |
| `apps/api/src/domains/savings/schemas/saving.schema.ts`                       | Zod schemas for request/response                          |
| `apps/api/src/infrastructure/database/repositories/PrismaSavingRepository.ts` | Prisma implementation                                     |
| `apps/api/src/controllers/saving/SavingController.ts`                         | CRUD routes under `/api/budgets/:id/savings`              |

## Files Modified

| File                                  | Change                           |
| ------------------------------------- | -------------------------------- |
| `apps/api/src/config/di.container.ts` | Registered `ISavingRepository`   |
| `apps/api/src/app.ts`                 | Mounted `createSavingController` |

## API Endpoints

| Method | Path                            | Description      |
| ------ | ------------------------------- | ---------------- |
| GET    | `/api/budgets/:id/savings`      | List all savings |
| POST   | `/api/budgets/:id/savings`      | Create saving    |
| PATCH  | `/api/budgets/:id/savings/:sid` | Update saving    |
| DELETE | `/api/budgets/:id/savings/:sid` | Delete saving    |

## Frequency Support

All Frequency enum values supported: ONE_TIME, MONTHLY, YEARLY, EVERY_X_MONTHS, EVERY_X_YEARS. Optional `frequencyValue` for X-based frequencies.

## Tests

Integration tests in `src/__tests__/integration/saving.test.ts`: 9 tests covering CRUD + auth checks.
