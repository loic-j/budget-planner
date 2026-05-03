# Task 21 — Projections Screen

## Status

`TODO`

## Description

Full analytical view: six charts, a person age timeline, a filter bar, and tabbed data tables. The richest screen in the app. Documented in `docs/screens/10-projections.md`.

## What to build

### Page — `apps/web/src/pages/ProjectionsPage.tsx`

- Fetches `GET /api/budgets/:id/projection?granularity=monthly` on mount
- Fetches `GET /api/budgets/:id/persons` for age timeline
- Filter state (person, category, date range) stored in URL query params via `useSearchParams`

### FilterBar — `apps/web/src/components/projections/FilterBar.tsx`

Desktop: inline row of selects. Mobile: `[Filters ▾]` button → bottom `Drawer`.

Controls:

- **Person** — "All" + one per person in budget
- **Category** — "All" + one per category (grouped by EXPENSE / REVENUE / SAVING)
- **Date range** — full projection (default) | custom range (two DatePickers)
- **Export** button — downloads CSV of current visible data

Changing any filter updates URL query params + re-slices projection data (no API re-fetch — filter client-side).

### 1. NetWorthChart — `apps/web/src/components/projections/NetWorthChart.tsx`

- `LineChart (@mui/x-charts)` — lines: Net Worth (bold), Assets, Cumulative Savings, Total Debt
- Milestone annotations: vertical dashed lines + labels for retirement ages, loan payoff dates, child births
- Full width, height 280px

### 2. CashFlowChart — `apps/web/src/components/projections/CashFlowChart.tsx`

- `BarChart (@mui/x-charts)` — grouped bars per year: Revenue (green) + Expenses (red)
- Toggle: yearly | monthly granularity
- Stacked variant: expense bars broken down by category

### 3. CumulativeSavingsChart — `apps/web/src/components/projections/CumulativeSavingsChart.tsx`

- `LineChart (@mui/x-charts)` — reuse from `SavingsBalanceChart` (Task 18) or extract shared component
- Target markers + "Goal reached" annotations

### 4. PersonAgeTimeline — `apps/web/src/components/projections/PersonAgeTimeline.tsx`

- Horizontal bar per person spanning their life within the projection window
- Built with `BarChart (@mui/x-charts)` (horizontal) or custom SVG/MUI Box rendering
- Bar shows age label every 5 years
- Planned children: dotted bar segment before birth date, solid after
- Milestone markers on bars:
  - School start (CHILD age 3–5, based on country — default age 3)
  - University (CHILD age 18)
  - Retirement (ADULT, if retirement age is set in persons — **note**: retirement age field not yet in Person entity; add as proposed field or use default age 65)
- Hover: tooltip showing person name, age at hovered year, active revenues/expenses linked to them at that date
- Height: 40px per person

### 5. ExpenseBreakdownChart — `apps/web/src/components/projections/ExpenseBreakdownChart.tsx`

- `BarChart (@mui/x-charts)` stacked — X axis: years, stacked by category
- Toggle: yearly total | monthly average

### 6. RevenueBreakdownChart — `apps/web/src/components/projections/RevenueBreakdownChart.tsx`

- Same structure, split by category or person

### DataTables — `apps/web/src/components/projections/ProjectionDataTables.tsx`

- MUI `Tabs`: Expenses | Revenues | Savings | Assets
- Each tab: read-only `DataGrid` with same columns as the data entry screens
- Sortable, filterable (MUI DataGrid built-in)
- Export CSV button per tab

### Layout

Desktop: filter bar → charts in a 2-column grid (or full width for wide charts) → data tables.
Mobile: filter drawer button → charts stacked full width → data tables.

## Steps

1. Build `FilterBar` with URL-synced state
2. Build `NetWorthChart` with milestone annotations
3. Build `CashFlowChart` with granularity toggle
4. Extract/reuse `CumulativeSavingsChart`
5. Build `PersonAgeTimeline` — hardest component; consider custom SVG if `BarChart (@mui/x-charts)` horizontal is too constrained
6. Build `ExpenseBreakdownChart` and `RevenueBreakdownChart`
7. Build `ProjectionDataTables`
8. Build `ProjectionsPage` composing everything with filter wiring
9. Test: set person filter → charts re-slice. Set date range → charts trim. Export CSV → verify file downloads.

## Dependencies

- **Task 12** — Projection API (full monthly data)
- **Task 13** — AppShell layout
- **Task 18** — `CumulativeSavingsChart` reused or extracted

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: filter implementation (URL params vs state), PersonAgeTimeline rendering approach (MUI X Charts vs custom SVG), milestone marker logic, any shared chart components extracted
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — start dev server and verify all 6 charts render, filters work, and person age timeline shows correct ages with milestone markers
