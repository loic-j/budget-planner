# Task 15 — Budget Settings Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                          | Purpose                            |
| --------------------------------------------- | ---------------------------------- |
| `apps/web/src/pages/budgets/SettingsPage.tsx` | Budget metadata edit + People CRUD |

## Features

### Budget Settings Section

- Inline form: name, start date, end date, initial saving
- PATCH `/api/budgets/:id` on save
- Calls `BudgetContext.reload()` after save to refresh sidebar name

### People Section

- List view: name, type (ADULT/CHILD), sex, DOB or planned DOB
- Add/Edit dialog: name, type select, sex select
  - ADULT: single DOB field (required)
  - CHILD: DOB field (if born) OR planned DOB field (if not yet born), mutually exclusive
- Delete confirm dialog
- POST/PATCH/DELETE `/api/budgets/:id/persons`

## UX Notes

- People linked to expenses/revenues/savings for per-person scoping
- Planned DOB and actual DOB are mutually exclusive for CHILD type — clearing one when the other is filled
- Snackbar for save/error feedback
