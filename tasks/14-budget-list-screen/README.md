# Task 14 — Budget List Screen

## Status

`TODO`

## Description

Build the first screen after login: lists all budgets the user owns or is a member of, and provides the create budget flow. Documented in `docs/screens/02-budget-list.md`.

## What to build

### Page — `apps/web/src/pages/BudgetListPage.tsx`

- Fetches `GET /api/budgets` on mount using `useEffect` + `apiClient`
- Loading state: skeleton cards
- Error state: MUI `Alert`
- Empty state: centred illustration + "Create your first budget" CTA

### BudgetCard — `apps/web/src/components/budget/BudgetCard.tsx`

Displays:

- Role badge (`OWNER` / `EDITOR` / `VIEWER`) — MUI `Chip`
- Budget name
- Currency + date range (`MMM YYYY – MMM YYYY`)
- Member count
- **Open** button → `navigate(/budgets/:id)`
- `···` `IconButton` menu (OWNER/EDITOR only): Rename, Duplicate _(placeholder)_, Delete

### CreateBudgetDialog — `apps/web/src/components/budget/CreateBudgetDialog.tsx`

- MUI `Dialog`
- React Hook Form + Zod: name (required), startDate (required), endDate (required, after startDate), currency (required, searchable select), initialSaving (optional, default 0)
- Currency dropdown: common currencies first (EUR, USD, GBP, JPY, CHF…), full ISO list below divider
- On submit: `POST /api/budgets` → on success navigate to `/budgets/:id/settings`

### DeleteBudgetDialog — `apps/web/src/components/budget/DeleteBudgetDialog.tsx`

- Requires user to type budget name to confirm
- `DELETE /api/budgets/:id` → removes card from list

### Header — `apps/web/src/components/layout/TopBar.tsx`

- App name / logo (left)
- User avatar with dropdown: display name + email (non-clickable), Sign out (right)

## Steps

1. Build `TopBar` with user menu
2. Build `BudgetCard` component
3. Build `CreateBudgetDialog` with full form validation
4. Build `DeleteBudgetDialog`
5. Build `BudgetListPage` wiring everything together
6. Test: create budget, verify redirect to settings, delete budget, verify list updates

## Dependencies

- **Task 03** — Auth (session needed for user display)
- **Task 04** — Budget CRUD API
- **Task 13** — TopBar reuses theme; CreateBudgetDialog reused in BudgetSwitcher

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: currency list source, form validation decisions, loading/error/empty state patterns used
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — start dev server and test the full create→view→delete flow
