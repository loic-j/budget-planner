# Task 01 — Database Schema & Migrations

## Status

`DONE`

## Description

Write the full Prisma schema based on `docs/architecture/data-model.md` and run the initial migration. Also write the preset category seed list used by Task 07.

## What to build

### Prisma schema (`apps/api/prisma/schema.prisma`)

Add all models and enums from the data model:

- `User` — Better Auth managed (already partially exists)
- `Session`, `Account`, `Verification` — Better Auth tables
- `Budget` — with `start_date`, `end_date`, `currency`, `initial_saving`
- `BudgetMember` — junction with `BudgetRole` enum
- `BudgetInvite` — invite token with expiry + max_uses
- `Person` — `ADULT | CHILD` type, `dob`, `planned_dob`, `Sex` enum
- `Category` — per-budget, `CategoryType` enum, `is_preset` flag
- `Expense` — `ExpenseType` enum, `Frequency` enum, `frequency_value`
- `LoanDetail` — 1:1 with Expense, `LoanType` enum, `monthly_payment`
- `LoanPayment` — full amortization schedule rows
- `Revenue` — frequency, optional person + category
- `Saving` — frequency, optional person + category, `target_amount`
- `Asset` — `AssetType` enum, `annual_growth_rate`, optional `loanDetailId`

### Enums

```
Role, BudgetRole, PersonType, Sex, CategoryType,
ExpenseType, LoanType, Frequency, AssetType
```

### Cascade deletes

- Budget deleted → cascade: Person, Category, Expense, Revenue, Saving, Asset, BudgetMember, BudgetInvite
- Expense (LOAN) deleted → cascade: LoanDetail → LoanPayment
- LoanDetail deleted → set null: Asset.loanDetailId

### Migration

```bash
pnpm db:migrate
```

### Preset category seed constants

Create `apps/api/src/domains/categories/constants/presetCategories.ts` — exported array of preset category definitions (name + icon + type) used by Task 07 to seed on budget creation. No DB rows at this stage — just the constant.

## Steps

1. Update `prisma/schema.prisma` with all models and enums
2. Run `pnpm db:migrate` — name the migration `init_full_schema`
3. Verify with `pnpm db:studio` that all tables exist
4. Create preset category constants file
5. Run `pnpm typecheck` to verify Prisma client types generate correctly

## Dependencies

None — first task.

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` in this folder documenting: migration name, any schema decisions made, how to re-run if needed
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE
