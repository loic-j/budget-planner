# Task 23 — User Profile Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                             | Purpose                                       |
| ------------------------------------------------ | --------------------------------------------- |
| `apps/web/src/pages/profile/UserProfilePage.tsx` | Profile page with name edit + password change |

## Features

### Account Information

- Email field (disabled, read-only — Better Auth does not support email change)
- Display name field + Save button
- `authClient.updateUser({ name })` on save

### Change Password

- Current password, new password, confirm new password
- Client-side validation: passwords match, min 8 chars
- `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false })`
- Error: "Current password is incorrect" on API failure

### Navigation

- Header: back arrow → `/`, Budget Planner logo, Sign out
- Accessed from Budget List page via "Profile" button in header

## Route

`/profile` — `AuthGuard` wrapped, lazy loaded. Added to router alongside budget routes.

## Auth Client Methods Used

- `authClient.useSession()` — reads current user name/email
- `authClient.updateUser()` — updates display name
- `authClient.changePassword()` — changes password (Better Auth built-in)
