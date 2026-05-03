# Task 17 — Revenues Screen

## Status

`TODO`

## Description

Build the revenues screen with a real-time Nivo chart and an inline-editable DataGrid. Simpler than expenses — no sub-types. Chart can display lines per person when revenues are person-linked. Documented in `docs/screens/07-revenues.md`.

## What to build

### Page — `apps/web/src/pages/RevenuesPage.tsx`

Same pattern as `ExpensesPage`:

- Fetches `GET /api/budgets/:id/revenues` on mount
- Local draft state for pending edits
- 300ms debounce → chart recompute

### RevenueProjectionChart — `apps/web/src/components/revenues/RevenueProjectionChart.tsx`

- `@nivo/line` responsive chart
- Lines: one per person (for person-linked revenues) + "Other" (unlinked) + bold "Total"
- Selector `[▾]`: "Monthly total" | "Cumulative" | "By category" | "By person"
- If retirement ages set on persons: vertical dashed line at retirement year with label
- Chart height: 280px desktop, 200px mobile

### RevenuesGrid — `apps/web/src/components/revenues/RevenuesGrid.tsx`

MUI `DataGrid` — same editing pattern as `RegularExpensesGrid`. Columns:

| Column      | Editable | Type                              |
| ----------- | -------- | --------------------------------- |
| Name        | yes      | text                              |
| Category    | yes      | singleSelect (REVENUE categories) |
| Amount      | yes      | number                            |
| Frequency   | yes      | singleSelect                      |
| Freq. value | yes      | number (conditional)              |
| Person      | yes      | singleSelect (optional)           |
| Start date  | yes      | date                              |
| End date    | yes      | date                              |
| Actions     | no       | delete                            |

Toolbar: `+ Add row`, `Delete selected`, `Export CSV`, `[Save all]` button.

### Shared DataGrid patterns

`RegularExpensesGrid` and `RevenuesGrid` share the same editing lifecycle. Extract shared logic into:

- `apps/web/src/hooks/useDraftGrid.ts` — manages local draft rows, dirty tracking, processRowUpdate, batch save
- `apps/web/src/components/shared/GridToolbar.tsx` — reusable toolbar (Add row, Delete selected, Export, Save all)

This avoids duplicating the draft state logic across all four data screens.

## Steps

1. Build `RevenueProjectionChart`
2. Extract `useDraftGrid` hook from `RegularExpensesGrid` (Task 16) — do this refactor in this task
3. Extract `GridToolbar` shared component
4. Build `RevenuesGrid` using `useDraftGrid`
5. Build `RevenuesPage`
6. Test: add revenue linked to a person → verify chart shows separate line per person. Test retirement line marker if retirement age set.

## Dependencies

- **Task 09** — Revenues API
- **Task 12** — Projection API
- **Task 13** — AppShell layout
- **Task 16** — Shared grid patterns extracted here

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: `useDraftGrid` hook API, `GridToolbar` props, how person-split lines are computed from draft state
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — test real-time chart updates and the shared hook across both screens
