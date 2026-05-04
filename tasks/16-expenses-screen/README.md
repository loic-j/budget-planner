# Task 16 — Expenses Screen

## Status

`DONE`

## Description

Build the expenses screen with a real-time MUI X Charts line chart (top) and two MUI DataGrid tabs — Regular Expenses and Loans — (bottom). Chart updates within 300ms of any row edit. Documented in `docs/screens/06-expenses.md`.

## What to build

### Page — `apps/web/src/pages/ExpensesPage.tsx`

- Fetches `GET /api/budgets/:id/expenses` and `GET /api/budgets/:id/projection` on mount
- Holds local draft state for unsaved DataGrid rows
- Recomputes chart data client-side on every draft change (debounced 300ms)

### ExpenseProjectionChart — `apps/web/src/components/expenses/ExpenseProjectionChart.tsx`

- `LineChart (@mui/x-charts)` responsive line chart
- Data: one line per active expense category + bold "Total" line
- Loans appear as a separate "Loans" line that steps down to 0 when last loan ends
- X axis: years from `start_date` to `end_date`
- Y axis: monthly EUR amount
- Hover tooltip: year/month + per-category breakdown
- Selector dropdown `[▾]`: "Monthly total" | "Cumulative" | "By category (stacked)"
- Chart height: 280px desktop, 200px mobile

### RegularExpensesGrid — `apps/web/src/components/expenses/RegularExpensesGrid.tsx`

MUI `DataGridPro`-free (`DataGrid`) with columns:

| Column      | Editable | Type                                                 |
| ----------- | -------- | ---------------------------------------------------- |
| Name        | yes      | text                                                 |
| Category    | yes      | singleSelect (budget categories filtered by EXPENSE) |
| Amount      | yes      | number                                               |
| Frequency   | yes      | singleSelect (Frequency enum)                        |
| Freq. value | yes      | number — visible only when EVERY*X*\*                |
| Person      | yes      | singleSelect (budget persons, optional)              |
| Start date  | yes      | date                                                 |
| End date    | yes      | date                                                 |
| Actions     | no       | delete button                                        |

Toolbar:

- `+ Add row` — appends new row, focuses Name cell
- `Delete selected` — multi-select checkbox column
- `Export CSV`

Editing flow:

- `processRowUpdate` → validates with Zod → updates local draft state → triggers chart debounce
- Dirty rows: left border amber
- `[Save all]` button — batches all pending changes to API (`POST` new rows, `PATCH` modified rows, `DELETE` removed rows)
- Ctrl+S shortcut for save

### LoansGrid — `apps/web/src/components/expenses/LoansGrid.tsx`

Columns: Name, Type, Total Amount, Interest Rate (%), Duration (months), Monthly Payment (read-only), Start Date, Person, Actions.

Row click → expands `LoanAmortizationPanel` below (MUI `Collapse`):

- Fetches `GET /api/budgets/:id/expenses/:eid/loan-schedule`
- Table: Month, Payment, Principal, Interest, Remaining Balance
- Paginated: 12 rows per page (= 1 year)

Add loan → opens `AddLoanDrawer` (not inline DataGrid — form is richer):

### AddLoanDrawer — `apps/web/src/components/expenses/AddLoanDrawer.tsx`

Fields: Name, Type, Total amount, Interest rate, Duration (months), Start date, Person.
Live preview: "Monthly payment: €X XXX" updates as user types (client-side PMT formula).

## Steps

1. Install `@mui/x-charts` if not already present
2. Build `ExpenseProjectionChart` with static mock data first, then wire to projection API
3. Build `RegularExpensesGrid` — inline editing + local draft state
4. Implement 300ms debounce + chart recompute from draft state
5. Implement `[Save all]` batch API call
6. Build `LoansGrid` with amortization panel
7. Build `AddLoanDrawer` with live PMT preview
8. Build `ExpensesPage` composing all components
9. Test: add regular expense → chart updates live. Add loan → verify monthly payment preview. Save all → data persists after refresh.

## Dependencies

- **Task 08** — Expenses API + loan schedule endpoint
- **Task 12** — Projection API for initial chart data
- **Task 13** — AppShell layout

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: debounce approach, local draft state shape, batch save implementation, client-side PMT formula location
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — start dev server and test the real-time chart update flow end-to-end
