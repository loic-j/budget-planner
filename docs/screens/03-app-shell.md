# App Shell (Layout)

**Route:** `/budgets/:id/*`
Persistent layout wrapping all budget sub-pages.

---

## Desktop — Sidebar Expanded (240px)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐ ┌────────────────────────────────────────┐  │
│ │ [≡]  BudgetApp   │ │                                        │  │
│ │                  │ │         PAGE CONTENT                   │  │
│ │ Family 2025  [▾] │ │                                        │  │
│ │ ──────────────── │ │                                        │  │
│ │ [■] Dashboard    │ │                                        │  │
│ │ [■] Expenses     │ │                                        │  │
│ │ [■] Revenues     │ │                                        │  │
│ │ [■] Savings      │ │                                        │  │
│ │ [■] Assets       │ │                                        │  │
│ │ [■] Projections  │ │                                        │  │
│ │ ──────────────── │ │                                        │  │
│ │ [■] Members      │ │                                        │  │
│ │ [■] Settings     │ │                                        │  │
│ │                  │ │                                        │  │
│ │ ──────────────── │ │                                        │  │
│ │ [👤] Jane Doe    │ │                                        │  │
│ │     Sign out     │ │                                        │  │
│ └──────────────────┘ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Desktop — Sidebar Collapsed (64px)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────────────────────────────────────────────────┐    │
│ │ [≡]  │ │                                                  │    │
│ │      │ │         PAGE CONTENT                             │    │
│ │ [▾]  │ │                                                  │    │
│ │ ──── │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ ──── │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │ [■]  │ │                                                  │    │
│ │      │ │                                                  │    │
│ │ ──── │ │                                                  │    │
│ │ [👤] │ │                                                  │    │
│ └──────┘ └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

Hovering a collapsed icon shows a tooltip with the label.

---

## Mobile Layout

```
┌──────────────────────────┐
│ [≡]  Family 2025    [👤] │  ← AppBar (56px)
├──────────────────────────┤
│                          │
│                          │
│      PAGE CONTENT        │
│                          │
│                          │
│                          │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│  ← BottomNavigation (56px)
│  Dash Exp  Rev  Chart More│
└──────────────────────────┘
```

### Mobile "More" Drawer

Tapping `⋯ More` slides up a bottom drawer:

```
┌──────────────────────────┐
│ ▔▔▔▔▔▔                   │  ← drag handle
│                          │
│  [■]  Savings            │
│  [■]  Assets             │
│  ──────────────────────  │
│  [■]  Members            │
│  [■]  Settings           │
│                          │
└──────────────────────────┘
```

---

## Sidebar Behavior

| State     | Width | Content                      |
| --------- | ----- | ---------------------------- |
| Expanded  | 240px | Icon + label                 |
| Collapsed | 64px  | Icon only + tooltip on hover |

- Toggle button `[≡]` at top of sidebar switches states
- State persisted in `localStorage`
- Smooth CSS transition (200ms)
- Active route item highlighted with primary color + left border accent

## Budget Switcher

The budget name in the sidebar (expanded) or `[▾]` icon (collapsed) opens a popover listing all user's budgets — allows switching without returning to the budget list.

```
┌──────────────────────┐
│ Switch budget        │
│ ──────────────────── │
│ ● Family 2025        │  ← current
│   John's Budget      │
│   Shared Plan        │
│ ──────────────────── │
│ + New budget         │
└──────────────────────┘
```

## Role-Based Nav

| Nav item    | VIEWER | EDITOR    | OWNER |
| ----------- | ------ | --------- | ----- |
| Dashboard   | show   | show      | show  |
| Expenses    | show   | show      | show  |
| Revenues    | show   | show      | show  |
| Savings     | show   | show      | show  |
| Assets      | show   | show      | show  |
| Projections | show   | show      | show  |
| Members     | show   | show      | show  |
| Settings    | hide   | partial\* | show  |

\*EDITOR sees Settings but cannot change budget name, dates, currency, or delete budget. Can manage persons.

---

## Proposed Improvements

- **Breadcrumb** in AppBar on mobile for deeper navigation contexts
- **Unsaved changes badge** on nav items when the DataGrid has uncommitted rows
- **Keyboard shortcut** `[` / `]` to collapse/expand sidebar
