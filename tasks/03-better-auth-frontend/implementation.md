# Task 03 — Better Auth Frontend: Implementation Notes

## Status: DONE

## Files Created / Modified

| File                                                | Purpose                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/auth.ts`                          | BA React client, exports `{ authClient, useSession, signIn, signUp, signOut, SessionUser }`     |
| `apps/web/src/App.tsx`                              | Updated with full design system theme (teal primary, dark mode, Inter font, shadows)            |
| `apps/web/src/components/auth/AuthCard.tsx`         | Shared auth card shell (max-width 400px, paper bg, r-lg shadow-3)                               |
| `apps/web/src/components/auth/AuthGuard.tsx`        | Session-based route guard — spinner while pending, redirect to `/login?redirect=` if no session |
| `apps/web/src/router/index.tsx`                     | All routes with lazy loading + Suspense fallback                                                |
| `apps/web/src/pages/auth/LoginPage.tsx`             | Sign-in form with show/hide password, server error display, forgot password placeholder         |
| `apps/web/src/pages/auth/RegisterPage.tsx`          | Sign-up with live password strength checklist (4 criteria)                                      |
| `apps/web/src/pages/auth/EmailVerificationPage.tsx` | Resend email with 60s cooldown countdown                                                        |
| `apps/web/src/pages/budgets/BudgetListPage.tsx`     | Placeholder for Task 14                                                                         |
| `apps/web/src/pages/budgets/InviteAcceptPage.tsx`   | Placeholder for Task 05                                                                         |

## Route Structure

```
/login              → LoginPage (public)
/register           → RegisterPage (public)
/verify-email       → EmailVerificationPage (public)
/invite/:token      → InviteAcceptPage (public)
/                   → AuthGuard → BudgetListPage
/budgets/:id/*      → AuthGuard → BudgetListPage (placeholder until Task 13)
```

## E2E Flows Verified

1. `/` → AuthGuard redirects to `/login?redirect=%2F` when unauthenticated ✓
2. Register form → `/verify-email` with correct email shown ✓
3. Password strength checklist updates live as user types ✓
4. Login with verified credentials → redirects to `redirect` param or `/` ✓

## Key Notes

- BA v1.6.9: `requestPasswordReset` not `forgetPassword` for sending reset email
- `Shadows` type imported from `@mui/material/styles` for theme shadows array
- `@mui/icons-material@^6.4.1` added to web (must match `@mui/material` v6)
- Pre-existing web typecheck errors in `api.ts` / `Home.tsx` remain — resolved in Task 13
