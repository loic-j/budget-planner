# Task 08 — Implementation Notes

## Loan formula

Standard annuity (PMT):

```
r   = annualRate / 100 / 12
PMT = principal × r × (1+r)^n / ((1+r)^n - 1)
```

Special case: `annualRate = 0` → equal principal slices (`principal / n`), no division by zero.

## Amortization regeneration on update

`UpdateLoanExpenseUseCase` detects whether any of `totalAmount / interestRate / durationMonths / loanStartDate` changed. If so:

1. Recompute `monthlyPayment` via `calculateMonthlyPayment`
2. `UPDATE loanDetail` with new params + new `monthly_payment`
3. `deleteByLoan` all existing `LoanPayment` rows
4. `bulkCreate` fresh schedule
5. Also sync `expense.amount` to the new `monthly_payment`

If only metadata changed (name, personId, startDate, endDate), skips the schedule step.

## Edge cases

- **0% interest**: handled explicitly — equal principal slices, no NaN from division by zero.
- **Last payment rounding**: last payment pays the exact remaining balance to prevent floating-point drift from leaving a tiny non-zero balance.
- **Early payoff**: not modelled — schedule always runs to full `durationMonths`.
- **LOAN expense amount**: always set to `monthlyPayment` (derived field); updating financial params re-syncs it.

## Update routes split

PATCH is split into two endpoints to avoid discriminated-union parsing ambiguity at the controller level:

- `PATCH /{id}/expenses/{eid}/regular` — updates REGULAR fields
- `PATCH /{id}/expenses/{eid}/loan` — updates LOAN fields + triggers schedule regen

## Tests

- 7 unit tests for `LoanCalculationService` (PMT formula, schedule length, balance=0, sequential payment numbers, principal sum, 0% case)
- 13 integration tests covering: REGULAR CRUD, LOAN create/read schedule/update/delete, permission checks
