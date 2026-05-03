# Task 18 — Savings Screen

## Status

`TODO`

## Description

Build the savings screen with a cumulative balance chart (starts at `initial_saving`) and an inline-editable DataGrid. Target amount markers on the chart show when each goal is reached. Documented in `docs/screens/08-savings.md`.

## What to build

### Page — `apps/web/src/pages/SavingsPage.tsx`

Same draft-state pattern as Revenues/Expenses pages.

### SavingsBalanceChart — `apps/web/src/components/savings/SavingsBalanceChart.tsx`

- `@nivo/line` chart — cumulative balance (not monthly contributions)
- Starts at `initial_saving` value from budget metadata
- One line per saving entry + bold "Total"
- **Target markers**: for each saving with `targetAmount`, draw a horizontal dashed reference line at that value; annotate the x-axis point where the line is crossed with "Goal reached: MMM YYYY"
- If a target is never reached within `end_date`: label shown in amber "Not reached by YYYY"
- Selector `[▾]`: "Cumulative balance" | "Monthly contributions" | "By category"
- Chart height: 280px desktop, 200px mobile

### SavingsGrid — `apps/web/src/components/savings/SavingsGrid.tsx`

Uses `useDraftGrid` hook (from Task 17). Columns:

| Column        | Editable | Type                             |
| ------------- | -------- | -------------------------------- |
| Name          | yes      | text                             |
| Category      | yes      | singleSelect (SAVING categories) |
| Amount        | yes      | number                           |
| Frequency     | yes      | singleSelect                     |
| Freq. value   | yes      | number (conditional)             |
| Person        | yes      | singleSelect (optional)          |
| Start date    | yes      | date                             |
| End date      | yes      | date                             |
| Target amount | yes      | number (optional)                |
| Actions       | no       | delete                           |

Target amount column: shows a small progress chip when set — "45% of €10 000" computed from current projection.

## Steps

1. Build `SavingsBalanceChart` — start with cumulative logic, add target markers
2. Build `SavingsGrid` using `useDraftGrid`
3. Build `SavingsPage`
4. Test: add saving with target → verify goal marker appears on chart with correct date. Add saving without target → no marker. Reach goal mid-projection → marker at correct year.

## Dependencies

- **Task 10** — Savings API
- **Task 12** — Projection API (for initial balance + target date calculation)
- **Task 13** — AppShell layout
- **Task 17** — `useDraftGrid` hook and `GridToolbar` shared components

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: how target markers are computed (find first month where cumulative ≥ target), how initial_saving is included in the chart baseline
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — test target reached + not reached cases
