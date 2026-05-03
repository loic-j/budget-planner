# Expenses

**Route:** `/budgets/:id/expenses`
Two tabs: **Regular** and **Loans**. Real-time chart updates as rows are edited.

---

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Expenses                                              │
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  EXPENSE PROJECTION CHART  (@mui/x-charts)  [▾]   │ │
│         │  │                                                  │ │
│         │  │  €3 500 ─┤  ╭──╮    ╭────╮                      │ │
│         │  │  €3 000 ─┤──╯  ╰────╯    ╰──────────            │ │
│         │  │  €2 500 ─┤                                       │ │
│         │  │          2025  2030  2035  2040  2045  2055      │ │
│         │  │  ── Total   ── Housing   ── Food   ── Loans      │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  [ Regular Expenses ]  [ Loans ]                      │
│         │  ─────────────────────────────────────────────────    │
│         │                                                        │
│         │  ┌─────────────────────────────────────────────────┐  │
│         │  │ [+ Add row]  [✕ Delete selected]  [⬇ Export]   │  │
│         │  ├──────┬──────────┬──────────┬──────┬────┬───────┤  │
│         │  │ Name │ Category │ Amount   │ Freq │ Per│ Dates │  │
│         │  ├──────┼──────────┼──────────┼──────┼────┼───────┤  │
│         │  │ Rent │ Housing  │ € 1 200  │ Mo.  │ – │ 01/25 │  │
│         │  │ Food │ Food     │ € 600    │ Mo.  │ – │ 01/25 │  │
│         │  │ Gym  │ Health   │ € 40     │ Mo.  │ – │ 01/25 │  │
│         │  │ Car  │ Transp.  │ € 180    │ Mo.  │Jane│ 01/25│  │
│         │  │ *    │          │          │      │   │       │  │
│         │  └──────┴──────────┴──────────┴──────┴────┴───────┘  │
│         │  Showing 4 of 4 rows                    [Save all]    │
└──────────────────────────────────────────────────────────────────┘
```

## Desktop Layout — Loans Tab

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Expenses                                              │
│         │                                                        │
│         │  [same chart as above — loans appear as separate line]│
│         │                                                        │
│         │  [ Regular Expenses ]  [ Loans ]                      │
│         │  ─────────────────────────────────────────────────    │
│         │                                                        │
│         │  ┌─────────────────────────────────────────────────┐  │
│         │  │ [+ Add loan]  [✕ Delete selected]               │  │
│         │  ├────────────┬──────────┬─────────┬──────┬────────┤  │
│         │  │ Name       │ Type     │ Total   │ Rate │ Mo.Pay │  │
│         │  ├────────────┼──────────┼─────────┼──────┼────────┤  │
│         │  │ Mortgage   │ Mortgage │ €200 000│ 3.5% │ €1 001 │  │
│         │  │ Car loan   │ Car      │ €15 000 │ 4.2% │ €276   │  │
│         │  │ *          │          │         │      │        │  │
│         │  └────────────┴──────────┴─────────┴──────┴────────┘  │
│         │                           [click row to see schedule] │
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ [≡]  Expenses       [👤] │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │  CHART (@mui/x-charts)  │ │
│ │  [line chart]        │ │
│ │  height: 200px       │ │
│ └──────────────────────┘ │
│ [ Regular ] [ Loans ]    │
├──────────────────────────┤
│ [+ Add]    [Save all]    │
│ ┌──────────────────────┐ │
│ │ Rent · Housing       │ │
│ │ € 1 200 · Monthly    │ │
│ │ Jan 2025 →    [✎][✕] │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Food · Food          │ │
│ │ € 600 · Monthly      │ │
│ │ Jan 2025 →    [✎][✕] │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

On mobile, inline DataGrid is replaced by card list. Tapping a card or `[✎]` opens the edit drawer.

---

## Features

### Chart — `LineChart (@mui/x-charts)`

- X axis: years from `start_date` to `end_date`
- Y axis: monthly expense amount (EUR)
- Lines: one per active category + "Total" line (bold)
- Loan repayments appear as a separate line — shows the step-down when a loan ends
- Chart selector `[▾]`: toggle between "Monthly total", "Cumulative", "By category (stacked)"
- **Updates within 300ms** of any row edit (debounced re-projection)
- Hover tooltip: month/year + amount per category

### Regular Expenses DataGrid

Columns (all inline-editable):

| Column      | Type   | Notes                                                        |
| ----------- | ------ | ------------------------------------------------------------ |
| Name        | text   | required                                                     |
| Category    | select | preset + custom categories                                   |
| Amount      | number | currency formatted                                           |
| Frequency   | select | ONE_TIME / MONTHLY / YEARLY / EVERY_X_MONTHS / EVERY_X_YEARS |
| Freq. value | number | visible only when EVERY*X*\* selected                        |
| Person      | select | optional — people in this budget                             |
| Start date  | date   | optional                                                     |
| End date    | date   | optional                                                     |

Toolbar:

- `+ Add row` — appends a new empty row at bottom, auto-focuses first cell
- `Delete selected` — checkbox column for multi-select, delete confirmation
- `Export` — downloads CSV of current tab

Editing flow:

- Click any cell → enters edit mode
- Tab / Enter → moves to next cell
- Escape → cancels edit
- `Save all` button (or `Ctrl+S`) — commits all pending changes to the API
- Dirty rows highlighted with a subtle left border (yellow/amber)
- Validation errors shown as red cell border + tooltip

### Loans DataGrid

Columns:

| Column          | Type   | Notes                                            |
| --------------- | ------ | ------------------------------------------------ |
| Name            | text   | required                                         |
| Type            | select | MORTGAGE / CAR_LOAN / PERSONAL / STUDENT / OTHER |
| Total amount    | number |                                                  |
| Interest rate   | number | % annual                                         |
| Duration        | number | months                                           |
| Monthly payment | number | read-only, auto-calculated                       |
| Start date      | date   | first payment date                               |
| Person          | select | optional                                         |

Clicking a loan row expands an **amortization schedule panel** below the row:

```
┌──────────────────────────────────────────────────────────────────┐
│ Mortgage — Amortization Schedule                         [Close] │
│                                                                  │
│ Month │ Payment  │ Principal │ Interest │ Remaining balance      │
│ 1     │ € 1 001  │ € 418     │ € 583    │ € 199 582              │
│ 2     │ € 1 001  │ € 419     │ € 582    │ € 199 163              │
│ ...   │ ...      │ ...       │ ...      │ ...                    │
│ 360   │ € 1 001  │ € 998     │ € 3      │ € 0                    │
└──────────────────────────────────────────────────────────────────┘
```

Schedule is paginated (12 rows = 1 year per page).

---

## Proposed Improvements

- **Bulk paste from clipboard** — paste rows from Excel/Google Sheets directly into the DataGrid
- **Recurring expense templates** — save a set of expenses as a template, apply to new budgets
- **"What if" toggle** — temporarily disable a row to see chart impact without deleting it (row grayed out, chart excludes it)
- **Category inline creation** — when typing a new category name in the Category cell, offer "+ Create category" option inline
- **Expense tagging** — attach free-form tags to expenses for custom grouping in projections
