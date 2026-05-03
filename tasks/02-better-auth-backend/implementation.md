# Task 02 — Better Auth Backend: Implementation Notes

## Status: DONE

## Files Created

| File                                                            | Purpose                                                                                                         |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/config/auth.ts`                                   | `createAuthInstance(prisma)` — BA config with email+password, requireEmailVerification, session settings        |
| `apps/api/src/config/di.container.ts`                           | tsyringe DI container; exports `{ container, prisma }` singleton                                                |
| `apps/api/src/types/hono.ts`                                    | `BetterAuthUser`, `BetterAuthSession`, `AppEnv` type for Hono context                                           |
| `apps/api/src/middleware/auth.middleware.ts`                    | `createAuthMiddleware(auth)` — calls `auth.api.getSession()`, throws `UnauthorizedError` if null                |
| `apps/api/src/infrastructure/errors/DomainError.ts`             | `DomainError` base + `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError` |
| `apps/api/src/infrastructure/database/prisma.client.ts`         | `createPrismaClient()` with query/error event logging                                                           |
| `apps/api/src/domains/categories/constants/presetCategories.ts` | 22 preset categories (14 EXPENSE, 5 REVENUE, 3 SAVING)                                                          |

## Files Modified

| File                            | Change                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- |
| `apps/api/src/app.ts`           | Added auth routes mount, DomainError-aware `onError`, DI container import |
| `apps/api/prisma/schema.prisma` | BA models use camelCase timestamps (`createdAt`/`updatedAt`)              |

## Key Decisions

### BA v1.6.9 camelCase timestamps

Better Auth v1.6.9 Prisma adapter sends `createdAt`/`updatedAt` to Prisma. The schema originally used `created_at`/`updated_at` on BA-managed models (User, Session, Account, Verification). Fixed via migration `20260503110121_fix_ba_camelcase_timestamps`. App models (Budget, etc.) keep snake_case.

### Email enumeration protection

With `requireEmailVerification: true`, BA returns a synthetic 200 response (with `token: null`) for duplicate email sign-ups instead of 422. This prevents email enumeration attacks. Tests document this behavior.

### Verification email

`sendVerificationEmail` logs the URL via pino. No real email provider yet — marked with a TODO for pre-launch wiring.

## Tests

- **Unit** (`src/__tests__/unit/infrastructure/errors/DomainError.test.ts`): 8 tests covering all DomainError subclasses
- **Integration** (`src/__tests__/integration/auth.test.ts`): 6 tests covering sign-up, sign-in, auth middleware
  - Uses Hono in-process request dispatch (no HTTP server needed)
  - `beforeAll` pre-creates and verifies a user directly via Prisma for tests requiring a verified account
  - `afterAll` cleans up test users

## Migrations Applied

1. `20260503105144_init_full_schema` — all models and enums
2. `20260503110121_fix_ba_camelcase_timestamps` — rename BA model timestamps to camelCase
