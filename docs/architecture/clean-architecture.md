# Clean Architecture

## Layer Diagram

```
HTTP Request
     │
     ▼
┌─────────────┐
│ Controllers │  HTTP adapters — parse request, call use case, return response
└──────┬──────┘
       │ calls
       ▼
┌─────────────┐
│  Use Cases  │  Business logic — orchestrate domain entities and repositories
└──────┬──────┘
       │ uses interfaces
       ▼
┌─────────────────────┐
│ Repository Interface│  Domain contract — no infrastructure dependency
└──────┬──────────────┘
       │ implemented by
       ▼
┌──────────────────────┐
│ Prisma Repositories  │  Infrastructure — talks to the database
└──────────────────────┘
```

## Dependency Rule

Dependencies point **inward only**:

- Infrastructure depends on Domain
- Domain has **zero** external dependencies

## Layer Responsibilities

### Domain (`src/domains/*/`)

- **Entities** — pure TypeScript classes representing business objects
- **Repository interfaces** — contracts the infrastructure must fulfill
- **Use cases** — all business logic lives here

### Controllers (`src/controllers/*/`)

- Parse and validate HTTP input (Zod schemas)
- Call one use case
- Return typed JSON response
- Never contain business logic

### Infrastructure (`src/infrastructure/*/`)

- Prisma repository implementations
- Map infrastructure errors to domain errors
- Never imported by domain layer

### Config (`src/config/`)

- DI container registration (`di.container.ts`)
- Auth setup (`auth.ts`)
- Logger, OpenTelemetry

## Dependency Injection

Uses tsyringe. All classes decorated with `@injectable()`. Dependencies declared with `@inject(TOKEN)`.

```typescript
// Domain interface
export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
}

// Use case
@injectable()
export class GetBudgetUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}
  async execute(id: string): Promise<Budget> { ... }
}

// Registration in di.container.ts
container.register('IBudgetRepository', { useClass: PrismaBudgetRepository });
```

## Adding a New Feature (9-step pattern)

1. **Entity** — `src/domains/<feature>/entities/<Feature>.ts`
2. **Repository interface** — `src/domains/<feature>/repositories/I<Feature>Repository.ts`
3. **Use case(s)** — `src/domains/<feature>/usecases/<Action><Feature>UseCase.ts`
4. **Prisma repository** — `src/infrastructure/database/repositories/Prisma<Feature>Repository.ts`
5. **Zod schemas** — `src/domains/<feature>/schemas/<feature>.schema.ts`
6. **Controller** — `src/controllers/<feature>/<Feature>Controller.ts`
7. **DI registration** — wire in `src/config/di.container.ts`
8. **Mount routes** — add `.route('/api/<features>', ...)` in `src/app.ts`
9. **Frontend** — consume via `apiClient.<feature>.$get/post/...`
