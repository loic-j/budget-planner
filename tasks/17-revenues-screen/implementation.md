# Task 17 — Revenues Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                          | Purpose                                    |
| --------------------------------------------- | ------------------------------------------ |
| `apps/web/src/pages/budgets/RevenuesTab.tsx`  | Full revenues screen with DataGrid + chart |
| `apps/web/src/pages/budgets/RevenuesPage.tsx` | Route wrapper consuming BudgetContext      |

## Features

### DataGrid (draft-state pattern)

- Inline editable columns: name, amount, frequency, frequencyValue, category, person, startDate, endDate
- Dirty rows: 3px left `warning.main` border
- New row added locally (temp `new-*` id), saved on Ctrl+S
- Deleted rows tracked in `deletedIds` set, removed on Ctrl+S
- Save: POST new rows, PATCH dirty rows, DELETE deleted rows in parallel

### Chart

- MUI X LineChart: one series per person + "Other" (unassigned) + "Total"
- `PERSON_COLORS`: 6-color palette cycling per person
- `computeChartData()`: groups revenues by personId, applies `monthlyAmount()` frequency expansion per month
- 300ms debounce from draft state to chart recompute

### Summary Cards

- Total monthly revenue
- Revenue count

## API

GET/POST/PATCH/DELETE `/api/budgets/:id/revenues`
GET `/api/budgets/:id/categories?type=REVENUE`
GET `/api/budgets/:id/persons`
