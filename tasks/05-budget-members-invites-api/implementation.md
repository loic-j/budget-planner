# Task 05 — Implementation Notes

## Token generation

`crypto.randomBytes(16).toString('base64url')` — 128-bit URL-safe random string, no padding characters.

## Edge cases handled

- **Expired invite** (`expiresAt < now`): `AcceptInviteUseCase` throws `ValidationError`
- **Max uses reached** (`useCount >= maxUses`): throws `ValidationError`
- **Already a member**: throws `ConflictError` (409)
- **Owner trying to leave**: throws `ValidationError` — must transfer ownership first
- **Owner trying to remove/change-role on self**: throws `ValidationError`
- **Non-OWNER attempting restricted actions**: throws `ForbiddenError` (403)
- **`DELETE /members/me` vs `DELETE /members/:userId`**: `leaveRoute` registered first so literal `me` takes precedence over the param route

## Route layout

```
GET/POST/PATCH/DELETE /api/budgets/:id   → BudgetController (unchanged)
GET    /api/budgets/:id/members          → ListMembersUseCase
PATCH  /api/budgets/:id/members/:userId/role → ChangeMemberRoleUseCase
DELETE /api/budgets/:id/members/me       → LeaveBudgetUseCase   (registered first)
DELETE /api/budgets/:id/members/:userId  → RemoveMemberUseCase
GET    /api/budgets/:id/invites          → ListInvitesUseCase
POST   /api/budgets/:id/invites          → CreateInviteUseCase
DELETE /api/budgets/:id/invites/:id      → RevokeInviteUseCase
GET    /api/invite/:token                → PreviewInviteUseCase  (no auth)
POST   /api/invite/:token               → AcceptInviteUseCase   (auth per-route)
```

## Test results

- 18 integration tests (full invite flow + member management + max-uses constraint)
- 14 unit tests across 4 use cases (List, ChangRole, Remove, Leave, Accept)
- All 79 project tests pass
