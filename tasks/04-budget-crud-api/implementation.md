# Task 04 — Implementation Notes

## Files created

| Layer          | File                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Entity         | `src/domains/budget/entities/Budget.ts` — includes `BudgetRole` type and `BudgetMembership` interface             |
| Repo interface | `src/domains/budget/repositories/IBudgetRepository.ts`                                                            |
| Use cases      | `CreateBudgetUseCase`, `GetBudgetUseCase`, `ListUserBudgetsUseCase`, `UpdateBudgetUseCase`, `DeleteBudgetUseCase` |
| Prisma repo    | `src/infrastructure/database/repositories/PrismaBudgetRepository.ts`                                              |
| Schemas        | `src/domains/budget/schemas/budget.schema.ts`                                                                     |
| Controller     | `src/controllers/budget/BudgetController.ts`                                                                      |
| DI + routes    | `src/config/di.container.ts`, `src/app.ts`                                                                        |

## Domain rule decisions

- `GetBudgetUseCase` — checks `IBudgetRepository.findMember`; throws `ForbiddenError` if user is not a member
- `UpdateBudgetUseCase` — EDITOR can update `description` and `initialSaving` only; name/dates/currency require OWNER
- `DeleteBudgetUseCase` — OWNER only; cascade delete handled by Prisma schema
- `CreateBudgetUseCase` — creates `BudgetMember` row with `OWNER` role inline via Prisma nested write; `TODO` comment left for `SeedPresetCategoriesUseCase` (Task 07)

## Tests

- 5 unit test files, 1 integration test file (12 integration tests)
- All 79 project tests pass (as of Task 05 completion)
