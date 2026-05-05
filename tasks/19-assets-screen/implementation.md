# Task 19 — Assets Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                        | Purpose                                           |
| ------------------------------------------- | ------------------------------------------------- |
| `apps/web/src/pages/budgets/AssetsTab.tsx`  | Full assets screen with DataGrid + drawer + chart |
| `apps/web/src/pages/budgets/AssetsPage.tsx` | Route wrapper consuming BudgetContext             |

## Features

### DataGrid (read-only with computed columns)

- Columns: name, type chip, current value, acquisition date, growth rate, value today, value at budget end
- `_valueToday` and `_valueAtEnd` computed client-side via `assetValueAt()` — mirrors server `Asset.valueAt()` formula
- No inline editing — uses Add/Edit drawer instead

### Add/Edit Drawer

- Form fields: name, type (REAL_ESTATE/INVESTMENT/VEHICLE/OTHER), current value, acquisition date, annual growth rate
- POST on create, PATCH on edit
- Delete with confirm dialog

### Chart

- MUI X LineChart: one series per asset (color from `ASSET_TYPE_COLORS`) + "Total" series (white)
- Monthly value projection using client-side `assetValueAt()` across budget date range
- Series only shown if asset acquired before or during budget period

### Summary Cards

- Total asset value today
- Total projected value at budget end

## Key Function

```ts
assetValueAt(asset, date): number
  factor = 1 + annualGrowthRate / 100
  if factor <= 0: return 0
  years = (date - acquisitionDate) / msPerYear
  return max(0, currentValue * factor^years)
```

## API

GET/POST/PATCH/DELETE `/api/budgets/:id/assets`
