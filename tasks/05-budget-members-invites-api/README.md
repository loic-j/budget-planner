# Task 05 — Budget Members & Invites API

## Status

`TODO`

## Description

Implement member management (list, change role, remove) and invite link system (create token, revoke, accept). Covers the full sharing flow documented in `docs/screens/11-members.md`.

## What to build

### Entities

- `src/domains/budget/entities/BudgetMember.ts`
- `src/domains/budget/entities/BudgetInvite.ts`

### Repository interfaces

- `src/domains/budget/repositories/IBudgetMemberRepository.ts`
  - `findByBudget(budgetId)`, `findByBudgetAndUser(budgetId, userId)`, `create`, `update(role)`, `delete`
- `src/domains/budget/repositories/IBudgetInviteRepository.ts`
  - `findByToken(token)`, `findByBudget(budgetId)`, `create`, `incrementUseCount`, `delete`

### Use cases

- `ListMembersUseCase` — any member can list
- `ChangeMemberRoleUseCase` — OWNER only; cannot demote self
- `RemoveMemberUseCase` — OWNER only; cannot remove self
- `LeaveBudgetUseCase` — any non-OWNER member can leave
- `CreateInviteUseCase` — OWNER only; generates `crypto.randomBytes(16).toString('hex')` token
- `RevokeInviteUseCase` — OWNER only
- `ListInvitesUseCase` — OWNER only
- `AcceptInviteUseCase` — **public** (called after login); validates token expiry + max_uses, creates BudgetMember, increments use_count

### Zod schemas

- `createInviteSchema`: role (EDITOR | VIEWER), expiresAt?, maxUses?
- `changeMemberRoleSchema`: role
- `inviteResponseSchema`, `memberResponseSchema`

### Controller

**`src/controllers/budget/BudgetMemberController.ts`** — mounted at `/api/budgets/:id/members`:

```
GET    /api/budgets/:id/members              → ListMembersUseCase
PATCH  /api/budgets/:id/members/:userId/role → ChangeMemberRoleUseCase
DELETE /api/budgets/:id/members/:userId      → RemoveMemberUseCase
DELETE /api/budgets/:id/members/me           → LeaveBudgetUseCase
GET    /api/budgets/:id/invites              → ListInvitesUseCase
POST   /api/budgets/:id/invites              → CreateInviteUseCase
DELETE /api/budgets/:id/invites/:inviteId    → RevokeInviteUseCase
```

**`src/controllers/invite/InviteController.ts`** — mounted at `/api/invite` (no auth required):

```
GET  /api/invite/:token   → validate token, return budget name + role (for preview screen)
POST /api/invite/:token   → AcceptInviteUseCase (requires auth — middleware applied per route)
```

### Token generation

Use `crypto.randomBytes(16).toString('base64url')` for URL-safe tokens.

## Steps

1. Create entities
2. Create repository interfaces
3. Create all use cases with tests
4. Create Prisma repositories
5. Create Zod schemas
6. Create controllers with full OpenAPI docs
7. Register DI + mount routes in app.ts
8. Test full invite flow: create link → visit link → accept → verify BudgetMember created

## Dependencies

- **Task 04** — Budget entity and member role checks depend on BudgetRepository

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: token generation approach, edge cases handled (expired token, max uses, already a member)
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
