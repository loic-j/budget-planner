# Task 22 — Members Screen

## Status

`DONE`

## Description

Build the members management screen: list current members with role management, invite link generator, active invite links table, and the public invite acceptance flow. Documented in `docs/screens/11-members.md`.

## What to build

### Page — `apps/web/src/pages/MembersPage.tsx`

- Fetches `GET /api/budgets/:id/members` on mount
- Fetches `GET /api/budgets/:id/invites` (OWNER only)
- Role-gated sections: invite generator + active links visible to OWNER only

### InviteLinkGenerator — `apps/web/src/components/members/InviteLinkGenerator.tsx`

OWNER only. MUI `Card` with:

- **Role** select: EDITOR | VIEWER
- **Expires** select: Never | 24h | 7 days | 30 days | Custom date (DatePicker appears)
- **Max uses** select: Unlimited | 1 | 5 | 10 | Custom (number input appears)
- `[Generate link]` button → `POST /api/budgets/:id/invites` → displays generated URL
- Generated URL field (read-only `TextField`): full invite URL `${window.location.origin}/invite/:token`
- `[Copy link]` button → `navigator.clipboard.writeText(url)` → button label changes to "Copied!" for 2s

### MembersTable — `apps/web/src/components/members/MembersTable.tsx`

MUI `Table` (not DataGrid — simpler, fixed columns):

| Column  | Notes                                                                             |
| ------- | --------------------------------------------------------------------------------- |
| Avatar  | MUI `Avatar` — initials from name if no image                                     |
| Name    | Append "(you)" for current user                                                   |
| Role    | OWNER: read-only `Chip`. EDITOR/VIEWER: `Select` dropdown (OWNER only can change) |
| Joined  | Formatted date                                                                    |
| Actions | `[✕]` remove button — OWNER only, hidden on own row                               |

**Change role flow:**

- Select fires `PATCH /api/budgets/:id/members/:userId/role`
- Confirmation `Dialog` before submitting: "Change [name]'s role to [role]?"

**Remove member flow:**

- `[✕]` opens confirmation `Dialog`
- On confirm: `DELETE /api/budgets/:id/members/:userId` → refetch members

**Leave budget** (non-OWNER):

- `[Leave budget]` button at bottom of page
- Confirmation: "Leave [budget name]? You will lose access immediately."
- On confirm: `DELETE /api/budgets/:id/members/me` → navigate to `/`

### ActiveInviteLinksTable — `apps/web/src/components/members/ActiveInviteLinksTable.tsx`

OWNER only. MUI `Table`:

| Column  | Notes                                                      |
| ------- | ---------------------------------------------------------- |
| Role    | Chip                                                       |
| Uses    | `2/∞` or `2/5`                                             |
| Expires | Date or "Never"                                            |
| Link    | Truncated token + `[Copy]` button                          |
| Actions | `[✕]` revoke → `DELETE /api/budgets/:id/invites/:inviteId` |

### Invite Acceptance Flow — `apps/web/src/pages/InviteAcceptPage.tsx`

Public page at `/invite/:token`.

Flow:

1. `GET /api/invite/:token` → returns `{ budgetName, role }` or 404/expired error
2. If not logged in: show preview card ("You've been invited to join **[budget]** as **[role]**") + `[Sign in to accept]` → redirect to `/login?redirect=/invite/:token`
3. If logged in: show same preview card + `[Accept invitation]` button
4. On accept: `POST /api/invite/:token` → on success navigate to `/budgets/:id`
5. Error states:
   - Token expired: "This invite link has expired. Ask the budget owner for a new one."
   - Max uses reached: "This invite link has been used the maximum number of times."
   - Already a member: "You are already a member of this budget." + `[Open budget]` button

## Steps

1. Build `InviteLinkGenerator` with all select options + copy flow
2. Build `MembersTable` with role change + remove flows
3. Build `ActiveInviteLinksTable` with revoke
4. Build `MembersPage` composing everything with role-gated sections
5. Build `InviteAcceptPage` — test full flow: generate link → open in incognito → sign in → accept → verify member added
6. Test leave budget flow as a non-OWNER member

## Dependencies

- **Task 05** — Members & invites API
- **Task 13** — AppShell layout

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: invite URL construction, clipboard API usage, how the redirect-after-login flow works for invite acceptance, edge cases tested
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — test the full invite flow end-to-end including the unauthenticated → login → accept redirect chain
