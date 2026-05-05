# Task 13 — App Shell, Theme, Routing & Auth Guard

## Status

`DONE`

## Description

Build the persistent frontend layout used by all budget sub-pages: MUI theme, collapsible sidebar (desktop), bottom navigation (mobile), budget switcher, auth guard, and the full React Router route tree.

## What to build

### MUI Theme — `apps/web/src/theme/theme.ts`

- Dark mode via `colorSchemes.dark`
- Font: Inter (`@fontsource/inter`)
- Primary color: choose a financial-appropriate palette (e.g. indigo or teal)
- All colors via theme tokens — no hardcoded hex values in components

### Route tree — `apps/web/src/router.tsx`

Extend from Task 03. Add all budget sub-routes:

```
/budgets/:id                  → DashboardPage
/budgets/:id/settings         → BudgetSettingsPage
/budgets/:id/expenses         → ExpensesPage
/budgets/:id/revenues         → RevenuesPage
/budgets/:id/savings          → SavingsPage
/budgets/:id/assets           → AssetsPage
/budgets/:id/projections      → ProjectionsPage
/budgets/:id/members          → MembersPage
```

All wrapped in `<AuthGuard>` then `<AppShell>`.

### AppShell — `apps/web/src/components/layout/AppShell.tsx`

- Renders sidebar (desktop ≥ 900px) or AppBar + BottomNav (mobile < 900px)
- Uses `useMediaQuery(theme.breakpoints.up('md'))` to switch layouts
- Outlet for page content

### Sidebar — `apps/web/src/components/layout/Sidebar.tsx`

- Width: 240px expanded, 64px collapsed
- Toggle button at top (`MenuIcon` / `ChevronLeftIcon`)
- State persisted in `localStorage` key `sidebar_collapsed`
- Smooth CSS transition: `transition: width 200ms ease`
- Nav items: Dashboard, Expenses, Revenues, Savings, Assets, Projections, divider, Members, Settings
- Active item: `bgcolor: 'primary.main'` + left border accent
- Collapsed: icons only + MUI `Tooltip` on hover
- Budget switcher below logo (see below)
- User avatar + name + sign out at bottom

### Mobile AppBar + BottomNavigation

- AppBar: budget name + hamburger (opens same budget switcher as popover)
- BottomNavigation (5 items): Dashboard, Expenses, Revenues, Projections, More
- "More" → `Drawer` with: Savings, Assets, divider, Members, Settings

### Budget Switcher — `apps/web/src/components/layout/BudgetSwitcher.tsx`

- Fetches user's budgets via `apiClient.api.budgets.$get()`
- Popover listing budgets — click to navigate to `/budgets/:id`
- "+ New budget" at bottom → opens CreateBudgetDialog (reuse from Task 14)
- Current budget highlighted

### Role-based nav

- Fetch current user's role in this budget from the members API or budget response
- Settings nav item: hidden for VIEWERs

### API client context — `apps/web/src/lib/apiClient.ts`

- `hc<AppType>(baseURL)` — share one instance app-wide via React context or module singleton

## Steps

1. Install + configure MUI theme (dark mode, Inter font)
2. Extend router with all budget sub-routes (placeholder pages OK for now)
3. Build `AppShell` with responsive switch
4. Build `Sidebar` — collapsed/expanded, localStorage persistence
5. Build mobile `AppBar` + `BottomNavigation` + "More" drawer
6. Build `BudgetSwitcher`
7. Verify all nav links work and active state highlights correctly
8. Verify sidebar collapse persists across page refreshes

## Dependencies

- **Task 03** — Auth guard and base router already set up
- **Task 04** — Budget list API needed for budget switcher

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: theme colour choices, breakpoint used for responsive switch, localStorage key, any MUI version quirks
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — also start dev server and manually verify layout on both desktop and mobile viewport
