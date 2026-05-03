# Data Model

## Entity Relationship Diagram

```
User ──< BudgetMember >── Budget
User ──< Session
User ──< Account
```

## Models

### User

Core user entity. Managed by Better Auth.

| Field         | Type     | Notes         |
| ------------- | -------- | ------------- |
| id            | cuid     | PK            |
| email         | String   | Unique        |
| name          | String?  | Display name  |
| emailVerified | Boolean  | Default false |
| role          | Role     | USER \| ADMIN |
| created_at    | DateTime | Auto          |
| updated_at    | DateTime | Auto-updated  |

### Budget

A budget plan. Owned by one user, shareable with others via BudgetMember.

| Field       | Type     | Notes        |
| ----------- | -------- | ------------ |
| id          | cuid     | PK           |
| name        | String   |              |
| description | String?  |              |
| ownerId     | String   | FK → User    |
| created_at  | DateTime | Auto         |
| updated_at  | DateTime | Auto-updated |

### BudgetMember

Junction table: a user's access to a budget.

| Field     | Type       | Notes                     |
| --------- | ---------- | ------------------------- |
| id        | cuid       | PK                        |
| budgetId  | String     | FK → Budget               |
| userId    | String     | FK → User                 |
| role      | BudgetRole | OWNER \| EDITOR \| VIEWER |
| joined_at | DateTime   | Auto                      |

Unique constraint: `(budgetId, userId)`

### Better Auth tables

`Session`, `Account`, `Verification` — managed by Better Auth, do not modify directly.

## Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum BudgetRole {
  OWNER
  EDITOR
  VIEWER
}
```

## Conventions

- IDs: `cuid()` (URL-safe, sortable)
- Timestamps: `created_at`, `updated_at` (snake_case)
- Column names: snake_case
- Foreign keys: camelCase (Prisma convention)
- Cascade deletes on all child relationships
