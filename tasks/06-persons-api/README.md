# Task 06 — Persons Management API

## Status

`DONE`

## Description

Implement the Person domain — CRUD for adults and children attached to a budget. Validation rules differ between adults (dob required) and planned children (planned_dob instead of dob).

## What to build

### Entity — `src/domains/person/entities/Person.ts`

```typescript
export class Person {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly type: PersonType, // ADULT | CHILD
    public readonly name: string,
    public readonly sex: Sex,
    public readonly dob?: Date, // null for planned children
    public readonly plannedDob?: Date // only for unborn children
  ) {}

  get age(): number | null {
    const ref = this.dob ?? this.plannedDob;
    if (!ref) return null;
    return differenceInYears(new Date(), ref);
  }
}
```

### Repository interface — `src/domains/person/repositories/IPersonRepository.ts`

Methods: `findById`, `findByBudget(budgetId)`, `create`, `update`, `delete`

### Use cases — `src/domains/person/usecases/`

- `CreatePersonUseCase` — validates caller is OWNER or EDITOR of budget
- `UpdatePersonUseCase` — same auth check
- `DeletePersonUseCase` — same auth check; sets `personId = null` on linked expenses/revenues/savings (via repository, not cascade delete)
- `ListPersonsUseCase` — any budget member

### Zod schemas — `src/domains/person/schemas/person.schema.ts`

- `createAdultSchema`: name, sex, dob (required)
- `createChildSchema`: name, sex, type CHILD, dob? OR plannedDob? (one must be set)
- Use `.refine()` to enforce: for CHILD, exactly one of dob / plannedDob must be present

### Controller — `src/controllers/person/PersonController.ts`

Mounted at `/api/budgets/:id/persons`:

```
GET    /api/budgets/:id/persons       → ListPersonsUseCase
POST   /api/budgets/:id/persons       → CreatePersonUseCase
PATCH  /api/budgets/:id/persons/:pid  → UpdatePersonUseCase
DELETE /api/budgets/:id/persons/:pid  → DeletePersonUseCase
```

## Steps

1. Create entity with `age` getter
2. Create repository interface
3. Create all 4 use cases with tests
4. Create Prisma repository
5. Create Zod schemas with `.refine()` validation for child DOB logic
6. Create controller with full OpenAPI docs
7. Register DI + mount routes
8. Test: create adult, create born child, create planned child, delete person that has linked expenses

## Dependencies

- **Task 04** — Budget membership check (caller must be OWNER or EDITOR)

## Notes for Claude

> When working on this task:
>
> 1. Set **Status** to `IN_PROGRESS` at the start of work
> 2. Set **Status** to `DONE` when complete
> 3. Create `implementation.md` documenting: Zod refine logic for child validation, how delete handles linked items
> 4. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before marking DONE
