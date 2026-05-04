# Task 08 — Expenses API

## Status

`DONE`

## Description

Implement the Expense domain covering two types: REGULAR (recurring or one-time) and LOAN (with full amortization schedule auto-generated). The loan calculation service computes monthly payment and generates all LoanPayment rows.

## What to build

### Entities

- `src/domains/expenses/entities/Expense.ts`
- `src/domains/expenses/entities/LoanDetail.ts`
- `src/domains/expenses/entities/LoanPayment.ts`

### Loan calculation service — `src/domains/expenses/services/LoanCalculationService.ts`

```typescript
// Standard annuity formula
// r = annualRate / 100 / 12
// PMT = principal × r × (1+r)^n / ((1+r)^n - 1)
calculateMonthlyPayment(principal, annualRate, durationMonths): number

// Returns full array of LoanPayment objects
generateAmortizationSchedule(loanDetail): LoanPaymentData[]
```

### Repository interface — `src/domains/expenses/repositories/IExpenseRepository.ts`

Methods: `findById`, `findByBudget(budgetId)`, `create`, `update`, `delete`
Also: `ILoanDetailRepository` for `findByExpense`, `create`, `update`, `delete`
Also: `ILoanPaymentRepository` for `findByLoan(loanDetailId)`, `bulkCreate`, `deleteByLoan`

### Use cases — `src/domains/expenses/usecases/`

- `CreateRegularExpenseUseCase`
- `CreateLoanExpenseUseCase` — creates Expense + LoanDetail + all LoanPayment rows via `LoanCalculationService`
- `UpdateRegularExpenseUseCase`
- `UpdateLoanExpenseUseCase` — recalculates monthly_payment, deletes old LoanPayment rows, regenerates them
- `DeleteExpenseUseCase` — cascades to LoanDetail + LoanPayment
- `ListExpensesUseCase` — returns expenses with their LoanDetail if type=LOAN
- `GetLoanScheduleUseCase` — returns paginated LoanPayment rows for a loan

### Zod schemas — `src/domains/expenses/schemas/expense.schema.ts`

- `createRegularExpenseSchema`: name, categoryId?, personId?, amount, frequency, frequencyValue?, startDate?, endDate?
- `createLoanExpenseSchema`: name, personId?, loanType, totalAmount, interestRate, durationMonths, loanStartDate
- Use `.discriminatedUnion('type', [...])` to handle REGULAR vs LOAN in one schema
- `updateRegularExpenseSchema`, `updateLoanExpenseSchema`

### Controller — `src/controllers/expense/ExpenseController.ts`

Mounted at `/api/budgets/:id/expenses`:

```
GET    /api/budgets/:id/expenses                        → ListExpensesUseCase
POST   /api/budgets/:id/expenses                        → CreateRegularExpenseUseCase | CreateLoanExpenseUseCase
GET    /api/budgets/:id/expenses/:eid                   → GetExpenseUseCase
PATCH  /api/budgets/:id/expenses/:eid                   → UpdateRegularExpenseUseCase | UpdateLoanExpenseUseCase
DELETE /api/budgets/:id/expenses/:eid                   → DeleteExpenseUseCase
GET    /api/budgets/:id/expenses/:eid/loan-schedule     → GetLoanScheduleUseCase
```

## Steps

1. Create entities
2. Implement `LoanCalculationService` with unit tests (verify PMT formula, full schedule totals)
3. Create repository interfaces
4. Create all use cases with tests
5. Create Prisma repositories
6. Create Zod schemas with discriminated union
7. Create controller
8. Register DI + mount routes
9. Test: create mortgage → verify 360 LoanPayment rows, monthly_payment correct, schedule sums to total_amount + interest

## Dependencies

- **Task 04** — Budget membership auth check
- **Task 06** — Person FK validation
- **Task 07** — Category FK validation

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: loan formula used, how amortization regeneration works on update, edge cases (0% interest rate, early payoff not modelled)
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
