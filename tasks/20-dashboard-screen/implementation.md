# Task 20 — Dashboard Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                           | Purpose                                |
| ---------------------------------------------- | -------------------------------------- |
| `apps/web/src/pages/budgets/DashboardPage.tsx` | Dashboard with stat cards + two charts |

## Features

### Stat Cards (4)

- Monthly Revenue — first projection point revenue
- Monthly Expenses — first projection point expense
- Net Cash Flow / mo — revenue - expense - savingContribution (colored success/error based on sign)
- Final Net Worth — last projection point netWorth (colored success/error)

### Net Worth Over Time (LineChart)

- 3 series: Net Worth (teal, filled area), Cash Balance (blue), Savings (green)
- X axis: monthly labels, tick every 3 months
- Data from projection API monthly points

### Monthly Cash Flow (BarChart)

- 2 series: Revenue (green bars), Expenses (red bars)
- Same x axis as net worth chart

## Data Source

Single fetch to `GET /api/budgets/:id/projection` (monthly granularity). All charts derived from the same response — no extra API calls.

## Loading State

CircularProgress centered while projection fetch in flight. Returns null early if budget context not yet loaded.
