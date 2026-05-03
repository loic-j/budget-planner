# Revenues

**Route:** `/budgets/:id/revenues`
Real-time chart + inline-editable DataGrid.

---

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Revenues                                              │
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  REVENUE PROJECTION CHART   (@nivo/line)   [▾]   │ │
│         │  │                                                  │ │
│         │  │  €8 000 ─┤                    ╭──────────        │ │
│         │  │  €6 000 ─┤         ╭──────────╯                  │ │
│         │  │  €4 000 ─┤─────────╯                             │ │
│         │  │  €2 000 ─┤                                       │ │
│         │  │          2025  2030  2035  2040  2045  2055      │ │
│         │  │  ── Total  ── Salary/Jane  ── Salary/Marc        │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  ┌─────────────────────────────────────────────────┐  │
│         │  │ [+ Add row]  [✕ Delete selected]  [⬇ Export]   │  │
│         │  ├────────────┬──────────┬──────────┬──────┬───────┤  │
│         │  │ Name       │ Category │ Amount   │ Freq │Person │  │
│         │  ├────────────┼──────────┼──────────┼──────┼───────┤  │
│         │  │ Salary     │ Salary   │ € 3 500  │ Mo.  │ Jane  │  │
│         │  │ Salary     │ Salary   │ € 2 800  │ Mo.  │ Marc  │  │
│         │  │ Freelance  │ Freelance│ € 500    │ Mo.  │ Jane  │  │
│         │  │ *          │          │          │      │       │  │
│         │  └────────────┴──────────┴──────────┴──────┴───────┘  │
│         │  Showing 3 of 3 rows                    [Save all]    │
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ [≡]  Revenues       [👤] │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │  CHART (@nivo/line)  │ │
│ │  [line chart]        │ │
│ │  height: 200px       │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ [+ Add]       [Save all] │
│ ┌──────────────────────┐ │
│ │ Salary · Jane        │ │
│ │ € 3 500 · Monthly    │ │
│ │ Salary    [✎]  [✕]   │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Salary · Marc        │ │
│ │ € 2 800 · Monthly    │ │
│ │ Salary    [✎]  [✕]   │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Freelance · Jane     │ │
│ │ € 500 · Monthly      │ │
│ │ Freelance [✎]  [✕]   │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

---

## Features

### Chart — `@nivo/line`

- X axis: years from `start_date` to `end_date`
- Y axis: monthly revenue amount in budget currency
- Lines: one per person (if person-linked) + "Other" for unlinked + "Total" (bold)
- Retirement milestone: vertical dashed line when a person's revenue lines drop to 0 (if retirement age set in Settings)
- Chart selector `[▾]`: "Monthly total", "Cumulative", "By category", "By person"
- 300ms debounce on row edits before re-projection
- Hover tooltip: date + per-person breakdown

### DataGrid Columns

| Column      | Type   | Notes                                                        |
| ----------- | ------ | ------------------------------------------------------------ |
| Name        | text   | required                                                     |
| Category    | select | preset + custom revenue categories                           |
| Amount      | number | currency formatted                                           |
| Frequency   | select | ONE_TIME / MONTHLY / YEARLY / EVERY_X_MONTHS / EVERY_X_YEARS |
| Freq. value | number | visible only for EVERY*X*\*                                  |
| Person      | select | optional — links revenue to a person                         |
| Start date  | date   | optional                                                     |
| End date    | date   | optional                                                     |

Toolbar and editing behavior identical to Expenses screen — see [06-expenses.md](./06-expenses.md).

### Person-Linked Revenue Behavior

When a revenue row has a `personId`:

- Chart shows a separate line per person
- Projections screen can show income per person over their lifetime
- Revenue automatically dims in projections after person's `end_date` (if set) or retirement age

---

## Proposed Improvements

- **Net vs gross toggle** — flag per row to indicate whether amount is net (after tax) or gross; budget-level tax rate applied to compute net; shown as annotation on chart
- **Income growth rate** — optional % per year to model salary raises (e.g. +2%/year); chart reflects compound growth
- **Currency override per row** — for income in a foreign currency; auto-converts to budget currency using a fixed or editable rate
- **Pension auto-calculation** — if retirement age is set on a person, offer to estimate pension revenue based on pre-retirement salary (configurable replacement rate %)
