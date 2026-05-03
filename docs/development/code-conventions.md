# Code Conventions

## TypeScript

- `.js` extensions in all imports (ESM requirement)
- `import type` for type-only imports
- Named exports everywhere (default exports only for React page components)
- No `as any` — use proper types, generics, or type guards
- No `as unknown` to force compatibility — fix the schema/type mismatch instead
- No `.toJSON()` calls — return typed objects directly for Hono RPC type safety

## Backend Patterns

### Controller

```typescript
// ✅ Thin HTTP adapter
export function createBudgetController(auth: Auth) {
  const app = new OpenAPIHono<AppEnv>();

  app.openapi(getBudgetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const useCase = container.resolve(GetBudgetUseCase);
    const budget = await useCase.execute(id);
    return c.json(budget);
  });

  return app;
}
```

### Use Case

```typescript
// ✅ All business logic here
@injectable()
export class GetBudgetUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}

  async execute(id: string): Promise<Budget> {
    const budget = await this.repo.findById(id);
    if (!budget) throw new NotFoundError(`Budget ${id} not found`);
    return budget;
  }
}
```

### Repository interface (domain)

```typescript
// ✅ Pure interface, no Prisma import
export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findByOwner(ownerId: string): Promise<Budget[]>;
  create(data: CreateBudgetData): Promise<Budget>;
  update(id: string, data: UpdateBudgetData): Promise<Budget>;
  delete(id: string): Promise<void>;
}
```

### Prisma repository (infrastructure)

```typescript
// ✅ Implements interface, maps errors
@injectable()
export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Budget | null> {
    const row = await this.prisma.budget.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: PrismaBudget): Budget {
    return new Budget(row.id, row.name, row.ownerId);
  }
}
```

## Frontend Patterns

### API calls via Hono RPC

```typescript
// ✅ Type-safe, autocomplete on routes
const res = await apiClient.api.budgets.$get();
const data = await res.json(); // fully typed
```

### Forms

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name required'),
});
type FormValues = z.infer<typeof schema>;

const { control, handleSubmit } = useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onTouched',
  defaultValues: { name: '' },
});
```

### Theme colors — always use theme tokens

```tsx
// ✅
<Box sx={{ bgcolor: 'background.paper', color: 'text.primary' }} />

// ❌
<Box sx={{ bgcolor: '#ffffff', color: '#000000' }} />
```

## What NOT to Do

| ❌ Anti-pattern               | ✅ Correct                   |
| ----------------------------- | ---------------------------- |
| Prisma in use cases           | Repository pattern           |
| Business logic in controllers | Put in use cases             |
| Catch errors in controllers   | Let global error handler     |
| Default exports (non-React)   | Named exports                |
| Skip Zod validation           | Always validate input        |
| Undocumented endpoints        | `createRoute()` with OpenAPI |
| `as any` / `as unknown`       | Fix the type                 |
| `.toJSON()`                   | Return typed object          |
