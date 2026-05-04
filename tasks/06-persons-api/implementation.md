# Task 06 — Implementation Notes

## Files created

- `src/domains/person/entities/Person.ts` — `age` getter computes from `dob` (null for planned children)
- `src/domains/person/repositories/IPersonRepository.ts` — `CreatePersonData`, `UpdatePersonData` interfaces
- `src/domains/person/usecases/ListPersonsUseCase.ts` — any member
- `src/domains/person/usecases/CreatePersonUseCase.ts` — OWNER or EDITOR only
- `src/domains/person/usecases/UpdatePersonUseCase.ts` — OWNER/EDITOR; checks `person.budgetId === budgetId`
- `src/domains/person/usecases/DeletePersonUseCase.ts` — OWNER/EDITOR; Prisma `onDelete: SetNull` handles linked expense/revenue/saving nullification automatically
- `src/infrastructure/database/repositories/PrismaPersonRepository.ts` — maps `planned_dob` ↔ `plannedDob`
- `src/domains/person/schemas/person.schema.ts` — Zod schema with two `.refine()` calls
- `src/controllers/person/PersonController.ts` — 4 routes mounted at `/:id/persons`

## Zod validation logic

Two separate `.refine()` calls on `createPersonSchema`:

1. ADULT requires `dob` (date of birth is mandatory)
2. CHILD must have exactly one of `dob` or `plannedDob` — cannot have both, cannot have neither

```typescript
.refine((v) => v.type !== 'ADULT' || !!v.dob, { message: 'dob required for ADULT', path: ['dob'] })
.refine((v) => v.type !== 'CHILD' || !!(v.dob ?? v.plannedDob), { message: 'dob or plannedDob required for CHILD', path: ['dob'] })
.refine((v) => !(v.dob && v.plannedDob), { message: 'Cannot set both dob and plannedDob', path: ['plannedDob'] })
```

## Delete behaviour

`DeletePersonUseCase` calls `personRepo.delete(personId)`. The Prisma schema has `onDelete: SetNull` on the `personId` FK in `Expense`, `Revenue`, and `Saving`. Linked rows are kept; their `personId` becomes null automatically.

## Tests

- 8 unit tests in `src/__tests__/unit/domains/person/usecases/PersonUseCases.test.ts`
- 10 integration tests in `src/__tests__/integration/person.test.ts`
