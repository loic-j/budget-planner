# Task 15 — Budget Settings Screen

## Status

`TODO`

## Description

Two-tab settings screen: **Budget** (metadata) and **People** (person management). Documented in `docs/screens/05-budget-settings.md`.

## What to build

### Page — `apps/web/src/pages/BudgetSettingsPage.tsx`

- MUI `Tabs` + `TabPanel` pattern
- Tab 0: Budget metadata
- Tab 1: People management
- Role guard: VIEWERs see a read-only view; EDITORs can manage people but not budget metadata

### Budget Tab — `apps/web/src/components/settings/BudgetMetadataTab.tsx`

- React Hook Form + Zod: name, description?, startDate, endDate (after startDate), currency, initialSaving
- `PATCH /api/budgets/:id` on submit
- Save button disabled until dirty
- Warning dialog if date range change would exclude existing expenses/revenues (check via date comparison client-side)
- Danger zone (OWNER only): delete budget → `DeleteBudgetDialog` (reuse from Task 14) → on success navigate to `/`

### People Tab — `apps/web/src/components/settings/PeopleTab.tsx`

- Two MUI tables: Adults and Children
- Columns: Name, Sex, DOB / Planned DOB, Age (derived), Actions (edit, delete)
- "Age" column: computed from dob at render time with `differenceInYears(new Date(), dob)`
- Planned children: show "Planned – MMM YYYY" in Age column
- `[+ Add adult]` and `[+ Add child]` buttons open their respective drawers

### AddPersonDrawer — `apps/web/src/components/settings/AddPersonDrawer.tsx`

Shared drawer for add + edit. Props: `type: 'adult' | 'child'`, `person?: Person`.

Adult form fields: name (required), sex (radio), dob (MUI DatePicker, required)
Child form fields: name (optional), sex (radio, includes "Unknown"), born/planned toggle, dob or plannedDob picker

On save: `POST /api/budgets/:id/persons` or `PATCH /api/budgets/:id/persons/:pid` → refetch persons list.

### DeletePersonConfirmDialog

- If person has linked items: "Removing [name] will unlink them from X expenses, Y revenues, Z savings. These items will not be deleted." [Cancel] [Remove]
- If no linked items: simple confirm

## Steps

1. Build `BudgetMetadataTab` with form + save + danger zone
2. Build `PeopleTab` table with correct column rendering
3. Build `AddPersonDrawer` handling both adult and child modes + add/edit
4. Build `DeletePersonConfirmDialog`
5. Build `BudgetSettingsPage` composing the tabs
6. Test: edit metadata, add adult, add born child, add planned child, delete person with linked items

## Dependencies

- **Task 04** — Budget update/delete API
- **Task 06** — Persons API
- **Task 13** — AppShell layout

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: date picker library used, role-based UI decisions, how the born/planned toggle works in the child form
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — test all person types and the EDITOR role restrictions
