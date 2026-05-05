# Task 12 — Projection Engine: Implementation Notes

## Status: DONE

## Files Created

| File                                                            | Purpose                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/api/src/domains/projection/types.ts`                      | `ProjectionPoint` and `PersonAgePoint` interfaces              |
| `apps/api/src/domains/projection/utils/frequencyUtils.ts`       | `monthlyAmount()` — expands frequency to per-month value       |
| `apps/api/src/domains/projection/services/ProjectionService.ts` | `compute()` single-pass loop + `aggregate()` for yearly rollup |
| `apps/api/src/domains/projection/schemas/projection.schema.ts`  | Zod response schemas                                           |
| `apps/api/src/controllers/projection/ProjectionController.ts`   | GET `/api/budgets/:id/projection`                              |
| `apps/api/src/__tests__/integration/projection.test.ts`         | 5 integration tests                                            |

## Files Modified

| File                  | Change                               |
| --------------------- | ------------------------------------ |
| `apps/api/src/app.ts` | Mounted `createProjectionController` |

## Algorithm

Single-pass monthly loop from `startDate` to `endDate`:

1. **Revenue**: sum `monthlyAmount()` for each active revenue
2. **Regular expenses**: sum `monthlyAmount()` for each regular expense
3. **Loan payments**: exact month match on `LoanPayment.paymentDate`; loan balance = `remainingBalance` of latest payment on/before month-end (or `totalAmount` if none yet)
4. **Saving contributions**: sum `monthlyAmount()` for each active saving
5. **Asset value**: sum `Asset.valueAt(date)` for each asset
6. **Balances**: `cashBalance += revenue - expense - savingContribution`; `savingsBalance += savingContribution`
7. **Net worth**: `cashBalance + savingsBalance + assetValue - loanBalance`

## Frequency Expansion (monthlyAmount)

| Frequency      | Monthly value                |
| -------------- | ---------------------------- |
| MONTHLY        | amount                       |
| YEARLY         | amount / 12                  |
| EVERY_X_MONTHS | amount / x                   |
| EVERY_X_YEARS  | amount / (x × 12)            |
| ONE_TIME       | amount (in start month only) |

StartDate/endDate bounds checked per item.

## Yearly Aggregation

`aggregate(points)`: groups by year, sums flows (revenue, expense, savingContribution), takes last-month balances (cashBalance, savingsBalance, assetValue, loanBalance, netWorth).

## PersonAgePoint

For each person, builds `ageByYear` map: `year - dob.getFullYear()`, null if year < birth year or no dob/plannedDob.

## API

```
GET /api/budgets/:id/projection?granularity=monthly|yearly&from=ISO&to=ISO
```

Returns `{ points: ProjectionPoint[], persons: PersonAgePoint[] }`.

## Tests (5 passing)

- 12 monthly points for 12-month budget
- First point: revenue=3000, expense=1000, cashBalance=3000 (initialSaving=1000)
- Yearly granularity: 1 point, revenue=36000
- Cumulative cashBalance grows each month
- netWorth = cashBalance + savingsBalance (no assets/loans)
