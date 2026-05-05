# Task 22 — Members Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                         | Purpose                                |
| -------------------------------------------- | -------------------------------------- |
| `apps/web/src/pages/budgets/MembersPage.tsx` | Members list + invite links management |

## Features

### Members List

- Fetches `/api/auth/get-session` + `/api/budgets/:id/members` in parallel
- Each member row: display name (email as fallback), email sub-label, role badge/select
- OWNER: sees role dropdowns for non-owner members + remove buttons
- Role change: PATCH `/api/budgets/:id/members/:userId/role`
- Remove member: DELETE `/api/budgets/:id/members/:userId`

### Invite Links (OWNER only)

- Lists active invite links with role chip, use count, expiry
- "Exhausted" chip when expired or max uses reached
- Copy invite URL to clipboard button
- Revoke (delete) button
- Create invite dialog: role select (EDITOR/VIEWER), POST `/api/budgets/:id/invites`

### Snackbar

Confirms "Invite link copied!" on clipboard copy.

## Notes

Moved from inline component inside old `BudgetDetailPage.tsx` to standalone page under the sidebar layout. Non-owner members get 403 on invite fetch — caught and ignored silently.
