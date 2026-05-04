import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListRevenuesUseCase } from '../../domains/revenues/usecases/ListRevenuesUseCase.js';
import { CreateRevenueUseCase } from '../../domains/revenues/usecases/CreateRevenueUseCase.js';
import { UpdateRevenueUseCase } from '../../domains/revenues/usecases/UpdateRevenueUseCase.js';
import { DeleteRevenueUseCase } from '../../domains/revenues/usecases/DeleteRevenueUseCase.js';
import {
  createRevenueSchema,
  updateRevenueSchema,
  revenueResponseSchema,
  revenueListResponseSchema,
} from '../../domains/revenues/schemas/revenue.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Revenue } from '../../domains/revenues/entities/Revenue.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const budgetIdParam = z.object({ id: z.string() });
const revenueParams = z.object({ id: z.string(), rid: z.string() });

function toRevenueResponse(r: Revenue) {
  return {
    id: r.id,
    budgetId: r.budgetId,
    name: r.name,
    categoryId: r.categoryId,
    personId: r.personId,
    amount: r.amount,
    frequency: r.frequency,
    frequencyValue: r.frequencyValue,
    startDate: r.startDate ? r.startDate.toISOString() : null,
    endDate: r.endDate ? r.endDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

const listRoute = createRoute({
  method: 'get',
  path: '/{id}/revenues',
  tags: ['Revenues'],
  summary: 'List revenues in a budget',
  request: {
    params: budgetIdParam,
    query: z.object({ personId: z.string().optional() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: revenueListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/{id}/revenues',
  tags: ['Revenues'],
  summary: 'Create a revenue',
  request: {
    params: budgetIdParam,
    body: { content: { 'application/json': { schema: createRevenueSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: revenueResponseSchema } },
      description: 'Created',
    },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}/revenues/{rid}',
  tags: ['Revenues'],
  summary: 'Update a revenue',
  request: {
    params: revenueParams,
    body: { content: { 'application/json': { schema: updateRevenueSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: revenueResponseSchema } },
      description: 'OK',
    },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}/revenues/{rid}',
  tags: ['Revenues'],
  summary: 'Delete a revenue',
  request: { params: revenueParams },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createRevenueController(authMiddleware: MiddlewareHandler) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { personId } = c.req.valid('query');
    const userId = c.get('user').id;
    const useCase = container.resolve(ListRevenuesUseCase);
    const revenues = await useCase.execute(id, userId, personId);
    return c.json(revenues.map(toRevenueResponse), 200);
  });

  app.openapi(createRoute_, async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('user').id;
    const useCase = container.resolve(CreateRevenueUseCase);
    const revenue = await useCase.execute(id, userId, {
      name: body.name,
      categoryId: body.categoryId,
      personId: body.personId,
      amount: body.amount,
      frequency: body.frequency,
      frequencyValue: body.frequencyValue,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
    return c.json(toRevenueResponse(revenue), 201);
  });

  app.openapi(updateRoute, async (c) => {
    const { id, rid } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('user').id;
    const useCase = container.resolve(UpdateRevenueUseCase);
    const revenue = await useCase.execute(id, userId, rid, {
      name: body.name,
      categoryId: body.categoryId,
      personId: body.personId,
      amount: body.amount,
      frequency: body.frequency,
      frequencyValue: body.frequencyValue,
      startDate:
        body.startDate !== undefined
          ? body.startDate
            ? new Date(body.startDate)
            : null
          : undefined,
      endDate:
        body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
    });
    return c.json(toRevenueResponse(revenue), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const { id, rid } = c.req.valid('param');
    const userId = c.get('user').id;
    const useCase = container.resolve(DeleteRevenueUseCase);
    await useCase.execute(id, userId, rid);
    return c.body(null, 204);
  });

  return app;
}
