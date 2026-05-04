import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListSavingsUseCase } from '../../domains/savings/usecases/ListSavingsUseCase.js';
import { CreateSavingUseCase } from '../../domains/savings/usecases/CreateSavingUseCase.js';
import { UpdateSavingUseCase } from '../../domains/savings/usecases/UpdateSavingUseCase.js';
import { DeleteSavingUseCase } from '../../domains/savings/usecases/DeleteSavingUseCase.js';
import {
  createSavingSchema,
  updateSavingSchema,
  savingResponseSchema,
  savingListResponseSchema,
} from '../../domains/savings/schemas/saving.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Saving } from '../../domains/savings/entities/Saving.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const budgetIdParam = z.object({ id: z.string() });
const savingParams = z.object({ id: z.string(), sid: z.string() });

function toSavingResponse(s: Saving) {
  return {
    id: s.id,
    budgetId: s.budgetId,
    name: s.name,
    categoryId: s.categoryId,
    personId: s.personId,
    amount: s.amount,
    frequency: s.frequency,
    frequencyValue: s.frequencyValue,
    startDate: s.startDate ? s.startDate.toISOString() : null,
    endDate: s.endDate ? s.endDate.toISOString() : null,
    targetAmount: s.targetAmount,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

const listRoute = createRoute({
  method: 'get',
  path: '/{id}/savings',
  tags: ['Savings'],
  summary: 'List savings in a budget',
  request: {
    params: budgetIdParam,
    query: z.object({ personId: z.string().optional() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: savingListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/{id}/savings',
  tags: ['Savings'],
  summary: 'Create a saving',
  request: {
    params: budgetIdParam,
    body: { content: { 'application/json': { schema: createSavingSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: savingResponseSchema } },
      description: 'Created',
    },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}/savings/{sid}',
  tags: ['Savings'],
  summary: 'Update a saving',
  request: {
    params: savingParams,
    body: { content: { 'application/json': { schema: updateSavingSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: savingResponseSchema } },
      description: 'OK',
    },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}/savings/{sid}',
  tags: ['Savings'],
  summary: 'Delete a saving',
  request: { params: savingParams },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createSavingController(authMiddleware: MiddlewareHandler) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { personId } = c.req.valid('query');
    const userId = c.get('user').id;
    const useCase = container.resolve(ListSavingsUseCase);
    const savings = await useCase.execute(id, userId, personId);
    return c.json(savings.map(toSavingResponse), 200);
  });

  app.openapi(createRoute_, async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('user').id;
    const useCase = container.resolve(CreateSavingUseCase);
    const saving = await useCase.execute(id, userId, {
      name: body.name,
      categoryId: body.categoryId,
      personId: body.personId,
      amount: body.amount,
      frequency: body.frequency,
      frequencyValue: body.frequencyValue,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      targetAmount: body.targetAmount,
    });
    return c.json(toSavingResponse(saving), 201);
  });

  app.openapi(updateRoute, async (c) => {
    const { id, sid } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('user').id;
    const useCase = container.resolve(UpdateSavingUseCase);
    const saving = await useCase.execute(id, userId, sid, {
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
      targetAmount: body.targetAmount,
    });
    return c.json(toSavingResponse(saving), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const { id, sid } = c.req.valid('param');
    const userId = c.get('user').id;
    const useCase = container.resolve(DeleteSavingUseCase);
    await useCase.execute(id, userId, sid);
    return c.body(null, 204);
  });

  return app;
}
