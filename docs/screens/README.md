# Screen Design Index

## Tech Notes

- **Charts:** MUI X Charts (`@mui/x-charts`) — `LineChart`, `BarChart`, `PieChart` — auto-syncs MUI theme and dark mode
- **Tables:** MUI X DataGrid (`@mui/x-data-grid` free tier) — inline row editing
- **UI:** Material-UI v6, dark mode, Inter font
- **Responsive:** collapsible sidebar on desktop, bottom navigation on mobile

---

## Screen Inventory

| #   | Screen             | Route                      | Doc                                              |
| --- | ------------------ | -------------------------- | ------------------------------------------------ |
| 1   | Login              | `/login`                   | [01-auth.md](./01-auth.md)                       |
| 2   | Register           | `/register`                | [01-auth.md](./01-auth.md)                       |
| 3   | Email Verification | `/verify-email`            | [01-auth.md](./01-auth.md)                       |
| 4   | Budget List        | `/`                        | [02-budget-list.md](./02-budget-list.md)         |
| 5   | App Shell (layout) | `/budgets/:id/*`           | [03-app-shell.md](./03-app-shell.md)             |
| 6   | Dashboard          | `/budgets/:id`             | [04-dashboard.md](./04-dashboard.md)             |
| 7   | Budget Settings    | `/budgets/:id/settings`    | [05-budget-settings.md](./05-budget-settings.md) |
| 8   | Expenses           | `/budgets/:id/expenses`    | [06-expenses.md](./06-expenses.md)               |
| 9   | Revenues           | `/budgets/:id/revenues`    | [07-revenues.md](./07-revenues.md)               |
| 10  | Savings            | `/budgets/:id/savings`     | [08-savings.md](./08-savings.md)                 |
| 11  | Assets             | `/budgets/:id/assets`      | [09-assets.md](./09-assets.md)                   |
| 12  | Projections        | `/budgets/:id/projections` | [10-projections.md](./10-projections.md)         |
| 13  | Members            | `/budgets/:id/members`     | [11-members.md](./11-members.md)                 |

---

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  UNAUTHENTICATED                                                │
│                                                                 │
│  /login ──────────────────────────────► /  (Budget List)       │
│     │                                                           │
│  /register ──► /verify-email ─────────► /  (Budget List)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BUDGET LIST  /                                                 │
│                                                                 │
│  Click budget ──────────────────────► /budgets/:id (Dashboard) │
│  Create budget ─────────────────────► /budgets/:id (Dashboard) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BUDGET SHELL  /budgets/:id/*                                   │
│                                                                 │
│  Sidebar / bottom nav provides access to all budget sub-pages: │
│                                                                 │
│  Dashboard ──────────────────────────── /budgets/:id           │
│  Expenses ───────────────────────────── /budgets/:id/expenses  │
│  Revenues ───────────────────────────── /budgets/:id/revenues  │
│  Savings ────────────────────────────── /budgets/:id/savings   │
│  Assets ─────────────────────────────── /budgets/:id/assets    │
│  Projections ────────────────────────── /budgets/:id/projections│
│  Members ────────────────────────────── /budgets/:id/members   │
│  Settings ───────────────────────────── /budgets/:id/settings  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Strategy

### Desktop (≥ 900px)

- Persistent collapsible left sidebar (240px expanded / 64px icon-only)
- Content fills remaining width
- Charts and tables shown simultaneously (split view)

### Mobile (< 900px)

- Full-width content
- Fixed top AppBar with budget name and hamburger menu
- Fixed bottom navigation (5 items: Dashboard, Expenses, Revenues, Projections, More)
- "More" opens a drawer with: Savings, Assets, Members, Settings
- Charts stack above tables (full width, scroll down to reach table)

---

## Chart Patterns

All data entry screens (Expenses, Revenues, Savings, Assets) follow the same layout:

```
┌──────────────────────────────────────────────────┐
│  REAL-TIME CHART  (top ~40% of content area)     │
│  Updates live as user edits rows in the table    │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│  DATA TABLE  (bottom ~60% of content area)       │
│  MUI DataGrid — inline editable rows             │
│  Add row button in toolbar                       │
└──────────────────────────────────────────────────┘
```

Chart debounce: 300ms after last edit before re-computing projection to avoid flicker.
