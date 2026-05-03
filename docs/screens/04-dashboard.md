# Dashboard

**Route:** `/budgets/:id`
Overview of the entire budget at a glance.

---

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                                                        │
│         │  Family 2025                    Jan 2025 – Jan 2055   │
│         │                                                        │
│         │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│         │  │ Monthly      │ │ Monthly      │ │ Net Cash     │  │
│         │  │ Revenue      │ │ Expenses     │ │ Flow         │  │
│         │  │              │ │              │ │              │  │
│         │  │  € 5 400     │ │  € 3 200     │ │  + € 2 200   │  │
│         │  │  /month      │ │  /month      │ │  /month      │  │
│         │  └──────────────┘ └──────────────┘ └──────────────┘  │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │ Net Worth                              [▾ 30yr]  │ │
│         │  │                                                  │ │
│         │  │  €800k ─┤                          ╭────────    │ │
│         │  │  €600k ─┤                     ╭────╯            │ │
│         │  │  €400k ─┤              ╭──────╯                 │ │
│         │  │  €200k ─┤       ╭──────╯                        │ │
│         │  │      0 ─┼───────╯                               │ │
│         │  │         2025   2030   2035   2040   2045   2055  │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │  ┌───────────────────────────┐ ┌─────────────────────┐│
│         │  │ Monthly Cash Flow (2025) │ │ Expense Breakdown   ││
│         │  │                          │ │                     ││
│         │  │ ▓▓ Revenue  ░░ Expenses  │ │     [pie chart]     ││
│         │  │  ▓▓ ░░ ▓▓ ░░ ▓▓ ░░ ▓▓  │ │  Housing  35%       ││
│         │  │  J  F  M  A  M  J  J    │ │  Food     20%       ││
│         │  │                          │ │  Loan     25%       ││
│         │  └───────────────────────────┘ └─────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ [≡]  Family 2025    [👤] │
├──────────────────────────┤
│ ┌────────┐ ┌───────────┐ │
│ │Monthly │ │Monthly    │ │
│ │Revenue │ │Expenses   │ │
│ │€ 5 400 │ │€ 3 200    │ │
│ └────────┘ └───────────┘ │
│ ┌──────────────────────┐ │
│ │ Net Cash Flow        │ │
│ │ + € 2 200 / month    │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Net Worth   [▾ 30yr] │ │
│ │                      │ │
│ │  [line chart]        │ │
│ │                      │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Monthly Cash Flow    │ │
│ │  [bar chart]         │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Expense Breakdown    │ │
│ │  [pie chart]         │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

---

## Summary Cards

Three cards displayed in a row (desktop) or 2+1 grid (mobile):

| Card             | Value                                      | Color logic              |
| ---------------- | ------------------------------------------ | ------------------------ |
| Monthly Revenue  | Sum of all active revenues at current date | neutral                  |
| Monthly Expenses | Sum of all active expenses at current date | neutral                  |
| Net Cash Flow    | Revenue − Expenses                         | green if > 0, red if < 0 |

Clicking a card navigates to the corresponding data screen.

---

## Charts

### Net Worth Over Time — `LineChart (@mui/x-charts)`

- X axis: years from `start_date` to `end_date`
- Y axis: net worth in budget currency
- Single line: `cash(t) + assets(t) − liabilities(t)`
- Hover tooltip: date + net worth value + breakdown (cash / assets / debt)
- Time range toggle: `10yr / 20yr / 30yr / full`
- Crosshair on hover

### Monthly Cash Flow — `BarChart (@mui/x-charts)`

- Grouped bar per month for current calendar year
- Two bars per month: Revenue (green) and Expenses (red)
- Hover tooltip: month + values
- Toggle to see full projection year range

### Expense Breakdown — `PieChart (@mui/x-charts)`

- One slice per expense category (top 6 + "Other")
- Amounts shown as monthly average
- Click slice → navigates to Expenses filtered by that category
- Legend below chart

---

## Interactions

- All charts update immediately when budget data changes in other screens
- Net worth chart time range selector persists in `localStorage`
- Cards are clickable: Revenue → `/expenses`, Expenses → `/expenses`, Net Cash Flow → `/projections`

---

## Proposed Improvements

- **Persons age snapshot** — small row below summary cards showing each person's current age and next milestone (e.g. "Emma turns 6 in 3 months — kindergarten costs incoming")
- **Budget health score** — single A–F grade derived from: positive cash flow, savings rate, debt-to-income ratio
- **Next milestone card** — surfaces the next significant planned event (child born, loan paid off, retirement)
- **Year-in-review** — annual summary visible in January showing previous year vs projections
