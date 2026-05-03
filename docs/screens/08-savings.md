# Savings

**Route:** `/budgets/:id/savings`
Real-time chart showing cumulative savings balance + inline-editable DataGrid.

---

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Savings                                               │
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  SAVINGS BALANCE CHART      (@nivo/line)   [▾]   │ │
│         │  │                                                  │ │
│         │  │  €500k ─┤                         ╭─────────    │ │
│         │  │  €400k ─┤                    ╭────╯             │ │
│         │  │  €300k ─┤               ╭────╯                  │ │
│         │  │  €200k ─┤ initial ──────╯                       │ │
│         │  │   €10k ─┼──────                                  │ │
│         │  │         2025  2030  2035  2040  2045  2055       │ │
│         │  │  ── Total  ── Emergency  ── Retirement           │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  ┌─────────────────────────────────────────────────┐  │
│         │  │ [+ Add row]  [✕ Delete selected]  [⬇ Export]   │  │
│         │  ├──────────────┬──────────┬────────┬──────┬───────┤  │
│         │  │ Name         │ Category │ Amount │ Freq │Target │  │
│         │  ├──────────────┼──────────┼────────┼──────┼───────┤  │
│         │  │ Emergency    │ Emergency│ € 300  │ Mo.  │ €10k  │  │
│         │  │ Retirement   │ Retiremt.│ € 500  │ Mo.  │ –     │  │
│         │  │ Kids college │ Other    │ € 200  │ Mo.  │ €50k  │  │
│         │  │ *            │          │        │      │       │  │
│         │  └──────────────┴──────────┴────────┴──────┴───────┘  │
│         │  Showing 3 of 3 rows                    [Save all]    │
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ [≡]  Savings        [👤] │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │  CHART (@nivo/line)  │ │
│ │  [cumulative line]   │ │
│ │  height: 200px       │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ [+ Add]       [Save all] │
│ ┌──────────────────────┐ │
│ │ Emergency fund       │ │
│ │ € 300 · Monthly      │ │
│ │ Target: € 10 000     │ │
│ │ [▓▓▓▓▓░░░░░] 45%     │ │
│ │           [✎]  [✕]   │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Retirement           │ │
│ │ € 500 · Monthly      │ │
│ │ No target            │ │
│ │           [✎]  [✕]   │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

---

## Features

### Chart — `@nivo/line`

- X axis: years from `start_date` to `end_date`
- Y axis: cumulative savings balance in budget currency
- Starts at `initial_saving` (from Budget metadata)
- Lines: one per saving entry + "Total" (bold)
- **Target markers**: horizontal dashed line at `target_amount` per saving entry; dot on the x-axis where the line crosses the target — annotated with "Goal reached: MMM YYYY"
- Chart selector `[▾]`: "Cumulative balance", "Monthly contributions", "By category"
- 300ms debounce on row edits

### DataGrid Columns

| Column        | Type   | Notes                                                        |
| ------------- | ------ | ------------------------------------------------------------ |
| Name          | text   | required                                                     |
| Category      | select | preset + custom saving categories                            |
| Amount        | number | currency formatted                                           |
| Frequency     | select | ONE_TIME / MONTHLY / YEARLY / EVERY_X_MONTHS / EVERY_X_YEARS |
| Freq. value   | number | visible only for EVERY*X*\*                                  |
| Person        | select | optional                                                     |
| Start date    | date   | optional                                                     |
| End date      | date   | optional                                                     |
| Target amount | number | optional goal — shows progress indicator                     |

### Target Progress (card view, mobile only)

When a saving row has a `target_amount`, the mobile card shows a linear progress bar:

- Current projected balance at target date / target amount
- Date when target is reached (derived from projection)
- If target never reached within `end_date`: shown in amber with "Not reached by 2055"

---

## Proposed Improvements

- **Interest rate per saving** — optional annual yield (e.g. savings account at 3%); compounds the balance in the projection, shown as a separate shaded area on the chart ("interest earned")
- **Goal deadline** — set a date by which the target must be reached; chart highlights in red if current contributions fall short
- **Savings rate indicator** — percentage of monthly income going to savings shown as a KPI badge above the chart (industry benchmark: 20%)
- **One-time withdrawal modeling** — negative saving entry to model a future planned withdrawal (e.g. house down payment in 2028)
