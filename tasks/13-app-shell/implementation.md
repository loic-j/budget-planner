# Task 13 — App Shell: Implementation Notes

## Status: DONE

## Files Created

| File                                      | Purpose                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/web/src/contexts/BudgetContext.tsx` | React context providing `budget`, `loading`, `reload` to all budget sub-pages |
| `apps/web/src/layouts/BudgetLayout.tsx`   | Sidebar layout with collapsible nav, wraps budget sub-routes via `<Outlet>`   |

## Files Modified

| File                            | Change                                                                     |
| ------------------------------- | -------------------------------------------------------------------------- |
| `apps/web/src/router/index.tsx` | Replaced flat `/budgets/:id` route with nested routes under `BudgetLayout` |

## Architecture

`BudgetLayout` wraps all `/budgets/:id/*` routes:

```
/budgets/:id           → redirect to /budgets/:id/dashboard
/budgets/:id/dashboard → DashboardPage
/budgets/:id/projections → ProjectionsPage
/budgets/:id/expenses  → ExpensesPage
/budgets/:id/revenues  → RevenuesPage
/budgets/:id/savings   → SavingsPage
/budgets/:id/assets    → AssetsPage
/budgets/:id/members   → MembersPage
/budgets/:id/settings  → SettingsPage
```

## Sidebar Design

- Width: 220px expanded / 56px collapsed
- Collapse toggle: small chevron button at mid-right edge of sidebar
- Active nav item: teal 3px left border + `rgba(0,150,136,0.12)` bg tint
- Nav sections: main (Dashboard, Projections, Expenses, Revenues, Savings, Assets) + bottom (Members, Settings)
- Footer: Sign out button with AccountCircleIcon
- Budget name shown in header alongside back-arrow to budget list
- Uses React Router `NavLink` for automatic active class detection

## BudgetContext

Fetches budget once at layout level, shared to all child pages via context. `reload()` trigger for Settings page to refresh after metadata save. Prevents redundant per-page fetches.

## Theme

Full MUI dark theme wired in `apps/web/src/App.tsx`: teal primary `#009688`, dark bg `#121212`/`#1e1e1e`, Inter font, custom shadows.
