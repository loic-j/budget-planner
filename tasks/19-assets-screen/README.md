# Task 19 — Assets Screen

## Status

`TODO`

## Description

Build the assets screen with a Nivo line chart showing projected asset values over time, and an add/edit drawer form (not inline DataGrid — the form is richer). Documented in `docs/screens/09-assets.md`.

## What to build

### Page — `apps/web/src/pages/AssetsPage.tsx`

- Fetches `GET /api/budgets/:id/assets` on mount
- No local draft state needed — assets use a drawer form (save immediately on submit)
- Chart updates after every add/edit/delete via refetch or optimistic update

### AssetValueChart — `apps/web/src/components/assets/AssetValueChart.tsx`

- `@nivo/line` chart
- One line per asset, color-coded by type (REAL_ESTATE, INVESTMENT, VEHICLE, OTHER)
- Bold "Total assets" line
- Appreciating lines curve up, depreciating lines curve down and flatten at 0
- Selector `[▾]`: "Individual values" | "Stacked total" | "Net (assets − loans)"
- Hover tooltip: date + per-asset value + total
- Chart height: 280px desktop, 200px mobile

Asset value at date T computed client-side:

```typescript
value(T) = currentValue × (1 + annualGrowthRate/100) ^ yearsSinceAcquisition
// floor at 0
```

### AssetList — `apps/web/src/components/assets/AssetList.tsx`

Desktop: MUI `DataGrid` (read-only, no inline editing — actions column only).
Mobile: card list.

Columns (desktop):
| Column | Notes |
|--------|-------|
| Name | |
| Type | chip with icon |
| Current value | |
| Acquisition date | |
| Growth rate | green (+) / red (-) coloring |
| Value today | computed |
| Value at end_date | computed |
| Actions | Edit, Delete |

### AddAssetDrawer — `apps/web/src/components/assets/AddAssetDrawer.tsx`

React Hook Form + Zod. Fields:

- Name (required)
- Type (select: REAL_ESTATE / INVESTMENT / VEHICLE / OTHER)
- Current value (positive number, required)
- Acquisition date (date picker, required)
- Annual growth rate (number, %, can be negative — shows "Depreciates" label when negative)

On save: `POST /api/budgets/:id/assets` → close drawer → refetch assets → chart updates.
Edit mode: pre-fills form, submits `PATCH`.

### DeleteAssetConfirmDialog

Simple confirm: "Delete [name]? This cannot be undone."

## Steps

1. Build `AssetValueChart` with client-side value projection
2. Build `AssetList` (desktop DataGrid + mobile cards)
3. Build `AddAssetDrawer` with form validation
4. Build `DeleteAssetConfirmDialog`
5. Build `AssetsPage` composing everything
6. Test: add real estate (+2.5%) → line curves up. Add vehicle (-12%) → line curves down, floors at 0. Delete asset → chart updates.

## Dependencies

- **Task 11** — Assets API
- **Task 13** — AppShell layout
- **Task 17** — `GridToolbar` shared component (reused for toolbar)

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: why drawer form instead of inline grid (richer form), client-side value projection formula location, floor-at-zero implementation
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — test appreciation, depreciation, and floor-at-zero cases in the chart
