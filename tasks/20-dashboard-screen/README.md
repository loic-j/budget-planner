# Task 20 — Dashboard Screen

## Status

`TODO`

## Description

Build the overview dashboard shown immediately after opening a budget. Three summary cards, a net worth line chart, a monthly cash flow bar chart, and an expense breakdown pie chart. Documented in `docs/screens/04-dashboard.md`.

## What to build

### Page — `apps/web/src/pages/DashboardPage.tsx`

- Fetches `GET /api/budgets/:id/projection?granularity=monthly` on mount
- Fetches `GET /api/budgets/:id/persons` for persons age snapshot (proposed feature)
- Derives summary values from the first projection point at or after today

### SummaryCards — `apps/web/src/components/dashboard/SummaryCards.tsx`

Three MUI `Card` components in a row (desktop) / 2+1 grid (mobile):

| Card             | Value                            | Derived from |
| ---------------- | -------------------------------- | ------------ |
| Monthly Revenue  | `projectionPoint(today).revenue` | Projection   |
| Monthly Expenses | `projectionPoint(today).expense` | Projection   |
| Net Cash Flow    | revenue − expense                | Derived      |

Net Cash Flow card: text color green if > 0, red if < 0.
Cards are clickable: Revenue → `/revenues`, Expenses → `/expenses`, Net → `/projections`.

### NetWorthChart — `apps/web/src/components/dashboard/NetWorthChart.tsx`

- `@nivo/line` — single bold line: `netWorth` over full projection period
- X axis: years, Y axis: currency
- Hover tooltip: date + net worth + breakdown (cash / assets / debt)
- Time range toggle: `10yr | 20yr | 30yr | Full` — persisted in `localStorage`
- Chart height: 240px

### CashFlowChart — `apps/web/src/components/dashboard/CashFlowChart.tsx`

- `@nivo/bar` — grouped bars per year (current + next 4 years by default)
- Two bars per year: Revenue (green) + Expenses (red/orange)
- Hover tooltip: year + values

### ExpenseBreakdownChart — `apps/web/src/components/dashboard/ExpenseBreakdownChart.tsx`

- `@nivo/pie` — one slice per top-6 expense category + "Other"
- Values: monthly average from today's projection
- Click slice → navigates to `/budgets/:id/expenses`
- Legend below chart

### Layout

Desktop: 3 cards (full width) → net worth chart (full width) → cash flow chart (60%) + pie chart (40%) side by side.

Mobile: 2+1 cards → charts stacked full width.

## Steps

1. Build `SummaryCards` with click navigation
2. Build `NetWorthChart` with time range toggle (localStorage)
3. Build `CashFlowChart`
4. Build `ExpenseBreakdownChart` with category click navigation
5. Build `DashboardPage` fetching projection data and passing to components
6. Test: verify card values match today's projection point. Test time range toggle persists. Test pie slice click navigates to expenses.

## Dependencies

- **Task 12** — Projection API
- **Task 13** — AppShell layout

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: how "today's" projection point is found, time range localStorage key, how projection data is sliced for each chart type
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — start dev server and verify all charts render with real data from the projection API
