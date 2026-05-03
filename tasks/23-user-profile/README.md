# Task 23 — User Profile Screen

## Status

`TODO`

## Description

Build the user profile screen where users can update their display name, change their email address, and change their password. Accessible from the user avatar menu in the sidebar / top bar.

## What to build

### Route

Add to router: `/profile` → `ProfilePage` (wrapped in `AuthGuard`, no `AppShell` budget shell — standalone page with a simple back navigation).

### Page — `apps/web/src/pages/ProfilePage.tsx`

Three sections as MUI `Card` components stacked vertically:

1. **Display name** — edit name, `PATCH /api/auth/update-user` (Better Auth endpoint)
2. **Email address** — change email, triggers re-verification flow
3. **Password** — change password (current password + new password + confirm)

### DisplayNameCard — `apps/web/src/components/profile/DisplayNameCard.tsx`

- Shows current name with inline edit (click pencil icon → field becomes editable)
- React Hook Form + Zod: `{ name: z.string().min(1) }`
- Saves via Better Auth `authClient.updateUser({ name })`
- Success: MUI `Snackbar` "Name updated"

### EmailCard — `apps/web/src/components/profile/EmailCard.tsx`

- Shows current email
- Form to enter new email
- On submit: Better Auth `authClient.changeEmail({ newEmail })` → sends verification to new address
- Info message: "A verification link has been sent to [newEmail]. Your email will update once verified."

### PasswordCard — `apps/web/src/components/profile/PasswordCard.tsx`

- Fields: current password, new password (with strength indicator), confirm new password
- Zod: `{ currentPassword: z.string().min(1), newPassword: z.string().min(8), confirmPassword }` + `.refine(confirm === new)`
- Saves via Better Auth `authClient.changePassword({ currentPassword, newPassword })`
- Success: Snackbar "Password updated"
- Error: inline "Current password is incorrect"

### Navigation entry point

User avatar menu (in `Sidebar` and mobile `AppBar`) — add "Profile settings" item linking to `/profile`.

## Steps

1. Add `/profile` route to router
2. Build `DisplayNameCard`
3. Build `EmailCard`
4. Build `PasswordCard`
5. Build `ProfilePage` composing the three cards
6. Add "Profile settings" link in sidebar/AppBar user menu
7. Test: update name → verify session reflects new name. Change password → sign out → sign in with new password.

## Dependencies

- **Task 03** — Auth client (`authClient.updateUser`, `authClient.changePassword`, `authClient.changeEmail`)
- **Task 13** — Sidebar user menu entry point

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: Better Auth methods used for each action, how the session name updates after display name change, email change verification flow
> 4. Run `pnpm lint:fix && pnpm typecheck` before marking DONE — test all three update flows end-to-end
