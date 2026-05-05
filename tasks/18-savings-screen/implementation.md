# Task 18 — Savings Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                         | Purpose                                   |
| -------------------------------------------- | ----------------------------------------- |
| `apps/web/src/pages/budgets/SavingsTab.tsx`  | Full savings screen with DataGrid + chart |
| `apps/web/src/pages/budgets/SavingsPage.tsx` | Route wrapper consuming BudgetContext     |

## Features

### DataGrid (draft-state pattern)

- Inline editable columns: name, amount, frequency, frequencyValue, targetAmount, category, person, startDate, endDate
- Same dirty/delete/Ctrl+S pattern as Expenses and Revenues screens

### Chart

- MUI X LineChart: monthly contribution series + cumulative savings balance series
- Shows both flow (how much saved per month) and stock (running total)
- 300ms debounce from draft state

### Summary Cards

- Total monthly savings contribution
- Count of goals with a target amount set

## API

GET/POST/PATCH/DELETE `/api/budgets/:id/savings`
GET `/api/budgets/:id/categories?type=SAVING`
GET `/api/budgets/:id/persons`
