# Task 14 — Budget List Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                            | Purpose                          |
| ----------------------------------------------- | -------------------------------- |
| `apps/web/src/pages/budgets/BudgetListPage.tsx` | Full budget list + create dialog |

## Features

- Header: app logo, Profile link (→ `/profile`), Sign out
- Grid of budget cards (3 cols on md, 2 on sm, 1 on xs)
- Each card: budget name, description, currency badge (teal), date range, initial saving if > 0
- Empty state: centered icon + CTA button
- "New budget" dialog: name, description, currency (7 options), start/end date, initial savings
- Form validation via React Hook Form + Zod; end date must be after start date
- On create: POST `/api/budgets`, reload list, close dialog

## Navigation

Clicking a card navigates to `/budgets/:id` (redirects to `/budgets/:id/dashboard` via router index redirect).
