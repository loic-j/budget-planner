# Budget List

**Route:** `/`
First screen after login. Shows all budgets the user owns or is a member of.

---

## Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Budget Planner                               [User avatar ▾]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  My Budgets                          [+ New Budget]            │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ [OWNER]          │  │ [EDITOR]         │  │ [VIEWER]     │ │
│  │                  │  │                  │  │              │ │
│  │ Family 2025      │  │ John's Budget    │  │ Shared Plan  │ │
│  │                  │  │                  │  │              │ │
│  │ EUR              │  │ USD              │  │ EUR          │ │
│  │ Jan 2025 → 2055  │  │ Mar 2024 → 2040  │  │ Jan 2025 →   │ │
│  │                  │  │                  │  │ 2045         │ │
│  │ 3 members        │  │ 1 member         │  │ 2 members    │ │
│  │                  │  │                  │  │              │ │
│  │ [Open]  [•••]    │  │ [Open]  [•••]    │  │ [Open]       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ Budget Planner      [👤] │
├──────────────────────────┤
│ My Budgets               │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ [OWNER]              │ │
│ │ Family 2025          │ │
│ │ EUR · Jan 2025–2055  │ │
│ │ 3 members            │ │
│ │ [Open]        [•••]  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ [EDITOR]             │ │
│ │ John's Budget        │ │
│ │ USD · Mar 2024–2040  │ │
│ │ 1 member             │ │
│ │ [Open]        [•••]  │ │
│ └──────────────────────┘ │
│                          │
│                          │
│        [+ New Budget]    │
└──────────────────────────┘
```

---

## Features

### Budget Cards

Each card shows:

- Role badge: `OWNER` (primary color) / `EDITOR` (secondary) / `VIEWER` (muted)
- Budget name
- Currency code
- Projection range: `start_date → end_date` (formatted as `MMM YYYY`)
- Member count
- **Open** button → navigates to `/budgets/:id`
- **···** menu (owners and editors only):
  - Rename
  - Duplicate (fork)
  - Delete (owner only — confirms with dialog)

### New Budget Dialog

Clicking `+ New Budget` opens a centered dialog:

```
┌──────────────────────────────────────┐
│ Create new budget             [✕]    │
│                                      │
│ Budget name *                        │
│ ┌──────────────────────────────────┐ │
│ │ My Budget 2025                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Start date *        End date *       │
│ ┌───────────────┐  ┌───────────────┐ │
│ │ 01/01/2025    │  │ 01/01/2055    │ │
│ └───────────────┘  └───────────────┘ │
│                                      │
│ Currency *                           │
│ ┌──────────────────────────────────┐ │
│ │ EUR - Euro              ▾        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Initial savings (optional)           │
│ ┌──────────────────────────────────┐ │
│ │ 10 000                           │ │
│ └──────────────────────────────────┘ │
│                                      │
│            [Cancel]  [Create]        │
└──────────────────────────────────────┘
```

On create:

- Budget record created
- System preset categories copied to new budget
- User added as `BudgetMember` with role `OWNER`
- Redirect to `/budgets/:id/settings` (to add persons)

### Empty State

When user has no budgets:

```
┌─────────────────────────────────────────────┐
│                                             │
│   [chart icon]                              │
│                                             │
│   No budgets yet                            │
│   Create your first budget to start         │
│   planning your financial future.           │
│                                             │
│   [+ Create your first budget]              │
│                                             │
└─────────────────────────────────────────────┘
```

### Header User Menu

Clicking user avatar opens dropdown:

- Display name + email (non-clickable)
- Profile settings
- Sign out

---

## Proposed Improvements

- **Search / filter** bar when user has many budgets (> 6)
- **Last opened** indicator on each card (e.g. "Opened 2 days ago")
- **Budget health indicator** — colored dot (green/yellow/red) based on projected cash flow
- **Pin budgets** — allow user to pin frequently used budgets to top
