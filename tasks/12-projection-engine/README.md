# Task 12 — Projection Engine

## Status

`TODO`

## Description

Core calculation service that takes all budget data and produces a time-series of monthly data points from `start_date` to `end_date`. Used by all chart screens and the dashboard. Must be fast enough for real-time frontend updates (< 100ms for a 30-year projection).

## What to build

### Domain service — `src/domains/projection/services/ProjectionService.ts`

Input: full budget snapshot (expenses, revenues, savings, assets, loan payments, persons).
Output: array of `ProjectionPoint` objects, one per month.

```typescript
interface ProjectionPoint {
  date: Date; // first day of month
  revenue: number; // sum of active revenues this month
  expense: number; // sum of active expenses this month (incl. loan payments)
  savingContribution: number; // sum of active saving contributions
  assetValue: number; // sum of all asset values at this date
  loanBalance: number; // sum of remaining loan balances at this date
  cashBalance: number; // cumulative: prev.cashBalance + revenue - expense - savingContribution
  savingsBalance: number; // cumulative: prev.savingsBalance + savingContribution
  netWorth: number; // cashBalance + savingsBalance + assetValue - loanBalance
}
```

### Frequency expansion helper

`src/domains/projection/utils/frequencyUtils.ts`

```typescript
// Returns true if an item with the given frequency is active in a given month
isActiveInMonth(item: { frequency, frequencyValue, startDate, endDate }, month: Date): boolean
```

Handles: ONE_TIME (active only in startDate month), MONTHLY, YEARLY, EVERY_X_MONTHS, EVERY_X_YEARS.

### Loan balance lookup

Use precomputed `LoanPayment` rows from the DB — no recalculation at projection time. For a given month, find the `LoanPayment` where `payment_date` matches and use `remaining_balance`.

### Asset value calculation

Use `Asset.valueAt(date)` — compound growth formula, floor at 0.

### API endpoint

**`src/controllers/projection/ProjectionController.ts`**

```
GET /api/budgets/:id/projection
```

Query params:

- `granularity`: `monthly` (default) | `yearly`
- `from`: ISO date (default: budget start_date)
- `to`: ISO date (default: budget end_date)

Returns: `{ points: ProjectionPoint[], persons: PersonAgePoint[] }`

`PersonAgePoint`:

```typescript
interface PersonAgePoint {
  personId: string;
  name: string;
  type: PersonType;
  ageByYear: Record<number, number | null>; // year → age (null if not yet born)
}
```

### Performance

For 30-year projections (360 months): pre-fetch all data once, expand in a single pass. Target < 100ms. Add a Vitest benchmark test.

## Steps

1. Create `ProjectionPoint` and `PersonAgePoint` types
2. Implement `frequencyUtils.isActiveInMonth` with full test coverage (all frequency types)
3. Implement `ProjectionService.compute()` — single-pass monthly loop
4. Write projection unit tests with known inputs and expected net worth values
5. Create controller + OpenAPI docs
6. Register DI + mount routes
7. Benchmark: generate 360-point projection, assert < 100ms
8. Test via Scalar: `GET /api/budgets/:id/projection?granularity=yearly`

## Dependencies

- **Task 08** — Expenses + LoanPayment data
- **Task 09** — Revenues data
- **Task 10** — Savings data
- **Task 11** — Assets data

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: algorithm walkthrough, frequency expansion logic, performance benchmark result, any edge cases (items with no start date, items past end date)
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
