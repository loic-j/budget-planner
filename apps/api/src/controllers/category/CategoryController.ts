import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListCategoriesUseCase } from '../../domains/categories/usecases/ListCategoriesUseCase.js';
import { CreateCategoryUseCase } from '../../domains/categories/usecases/CreateCategoryUseCase.js';
import { UpdateCategoryUseCase } from '../../domains/categories/usecases/UpdateCategoryUseCase.js';
import { DeleteCategoryUseCase } from '../../domains/categories/usecases/DeleteCategoryUseCase.js';
import {
  categoryListResponseSchema,
  categoryResponseSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../../domains/categories/schemas/category.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Category } from '../../domains/categories/entities/Category.js';
import type { CategoryType } from '../../domains/categories/entities/Category.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const budgetIdParam = z.object({ id: z.string() });
const categoryParams = z.object({ id: z.string(), cid: z.string() });

function toResponse(c: Category) {
  return {
    id: c.id,
    budgetId: c.budgetId,
    type: c.type,
    name: c.name,
    icon: c.icon,
    isPreset: c.isPreset,
    createdAt: c.createdAt.toISOString(),
  };
}

const listRoute = createRoute({
  method: 'get',
  path: '/{id}/categories',
  tags: ['Categories'],
  summary: 'List categories in a budget',
  request: {
    params: budgetIdParam,
    query: z.object({ type: z.enum(['EXPENSE', 'REVENUE', 'SAVING']).optional() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: categoryListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/{id}/categories',
  tags: ['Categories'],
  summary: 'Create a custom category',
  request: {
    params: budgetIdParam,
    body: { content: { 'application/json': { schema: createCategorySchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: categoryResponseSchema } },
      description: 'Created',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}/categories/{cid}',
  tags: ['Categories'],
  summary: 'Update a category',
  request: {
    params: categoryParams,
    body: { content: { 'application/json': { schema: updateCategorySchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: categoryResponseSchema } }, description: 'OK' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}/categories/{cid}',
  tags: ['Categories'],
  summary: 'Delete a category',
  request: { params: categoryParams },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createCategoryController(authMiddleware: MiddlewareHandler<AppEnv>) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const { type } = c.req.valid('query');
    const useCase = container.resolve(ListCategoriesUseCase);
    const categories = await useCase.execute(id, user.id, type as CategoryType | undefined);
    return c.json(categories.map(toResponse), 200);
  });

  app.openapi(createRoute_, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(CreateCategoryUseCase);
    const category = await useCase.execute(id, user.id, body);
    return c.json(toResponse(category), 201);
  });

  app.openapi(updateRoute, async (c) => {
    const user = c.get('user');
    const { id, cid } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(UpdateCategoryUseCase);
    const category = await useCase.execute(id, cid, user.id, body);
    return c.json(toResponse(category), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const user = c.get('user');
    const { id, cid } = c.req.valid('param');
    const useCase = container.resolve(DeleteCategoryUseCase);
    await useCase.execute(id, cid, user.id);
    return c.body(null, 204);
  });

  return app;
}
