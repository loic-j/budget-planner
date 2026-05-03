# Task 01 — Implementation Notes

## Migration

- Name: `init_full_schema`
- File: `apps/api/prisma/migrations/20260503105144_init_full_schema/migration.sql`
- Applied on top of the existing `init` migration which had User, Session, Account, Verification, Budget (partial), BudgetMember.

## Schema decisions

**Decimal precision:**

- Monetary amounts (`amount`, `total_amount`, `monthly_payment`, `current_value`, `initial_saving`, `target_amount`): `Decimal(15, 2)` — supports up to 999 billion with 2 decimal places
- Rates (`interest_rate`, `annual_growth_rate`): `Decimal(6, 3)` — supports e.g. `999.999%` (enough for any real-world rate)

**Cascade / set-null behaviour:**

- Budget → all children: `onDelete: Cascade` on all FK relations to Budget
- Expense → LoanDetail → LoanPayment: `onDelete: Cascade` chains automatically
- LoanDetail → Asset.loanDetailId: `onDelete: SetNull` — asset kept, loan link removed
- Person/Category deleted → Expense/Revenue/Saving: `onDelete: SetNull` on categoryId/personId (optional FKs)
- User → BudgetMember: `onDelete: Cascade` (member row gone, budget stays)

**Asset.loanDetailId is `@unique`** — one loan can finance at most one asset.

**BudgetInvite.role** does not include OWNER (enforced at application layer, not DB constraint).

## Preset categories

File: `apps/api/src/domains/categories/constants/presetCategories.ts`

- 14 expense presets, 5 revenue presets, 3 saving presets (22 total)
- Pure constants — no DB or Prisma imports (domain layer stays clean)
- Three filtered exports: `PRESET_EXPENSE_CATEGORIES`, `PRESET_REVENUE_CATEGORIES`, `PRESET_SAVING_CATEGORIES`
- Consumed by Task 07 (Categories API) to seed on budget creation

## Re-running migrations

```bash
# If DB needs full reset (dev only):
pnpm db:migrate reset

# Normal dev workflow:
pnpm db:migrate
```

## Known pre-existing typecheck issue

`apps/web` has 2 errors from the initial scaffold (`api.ts` imports `AppType` from the unbuilt API). Not introduced by this task — will be resolved in Task 13 (App Shell / routing setup).
