import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { CreateBudgetUseCase } from '../../domains/budget/usecases/CreateBudgetUseCase.js';
import { GetBudgetUseCase } from '../../domains/budget/usecases/GetBudgetUseCase.js';
import { ListUserBudgetsUseCase } from '../../domains/budget/usecases/ListUserBudgetsUseCase.js';
import { UpdateBudgetUseCase } from '../../domains/budget/usecases/UpdateBudgetUseCase.js';
import { DeleteBudgetUseCase } from '../../domains/budget/usecases/DeleteBudgetUseCase.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetResponseSchema,
  budgetListResponseSchema,
} from '../../domains/budget/schemas/budget.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Budget } from '../../domains/budget/entities/Budget.js';

function toResponse(b: Budget) {
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? null,
    ownerId: b.ownerId,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    currency: b.currency,
    initialSaving: b.initialSaving,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

const idParam = z.object({ id: z.string() });

const errorSchema = z.object({ error: z.string(), code: z.string() });

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Budgets'],
  summary: 'List all budgets for the current user',
  responses: {
    200: {
      content: { 'application/json': { schema: budgetListResponseSchema } },
      description: 'OK',
    },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['Budgets'],
  summary: 'Create a new budget',
  request: { body: { content: { 'application/json': { schema: createBudgetSchema } } } },
  responses: {
    201: {
      content: { 'application/json': { schema: budgetResponseSchema } },
      description: 'Created',
    },
    400: {
      content: { 'application/json': { schema: errorSchema } },
      description: 'Validation error',
    },
  },
});

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Budgets'],
  summary: 'Get a budget by ID',
  request: { params: idParam },
  responses: {
    200: { content: { 'application/json': { schema: budgetResponseSchema } }, description: 'OK' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Budgets'],
  summary: 'Update a budget',
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateBudgetSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: budgetResponseSchema } }, description: 'OK' },
    400: {
      content: { 'application/json': { schema: errorSchema } },
      description: 'Validation error',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Budgets'],
  summary: 'Delete a budget',
  request: { params: idParam },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createBudgetController(authMiddleware: MiddlewareHandler<AppEnv>) {
  const app = new OpenAPIHono<AppEnv>();

  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const user = c.get('user');
    const useCase = container.resolve(ListUserBudgetsUseCase);
    const budgets = await useCase.execute(user.id);
    return c.json(budgets.map(toResponse));
  });

  app.openapi(createRoute_, async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const useCase = container.resolve(CreateBudgetUseCase);
    const budget = await useCase.execute({ ...body, ownerId: user.id });
    return c.json(toResponse(budget), 201);
  });

  app.openapi(getRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(GetBudgetUseCase);
    const budget = await useCase.execute(id, user.id);
    return c.json(toResponse(budget), 200);
  });

  app.openapi(updateRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(UpdateBudgetUseCase);
    const budget = await useCase.execute({ budgetId: id, userId: user.id, ...body });
    return c.json(toResponse(budget), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(DeleteBudgetUseCase);
    await useCase.execute(id, user.id);
    return c.body(null, 204);
  });

  return app;
}
