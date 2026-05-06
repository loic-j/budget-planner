import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListAssetsUseCase } from '../../domains/assets/usecases/ListAssetsUseCase.js';
import { CreateAssetUseCase } from '../../domains/assets/usecases/CreateAssetUseCase.js';
import { UpdateAssetUseCase } from '../../domains/assets/usecases/UpdateAssetUseCase.js';
import { DeleteAssetUseCase } from '../../domains/assets/usecases/DeleteAssetUseCase.js';
import {
  createAssetSchema,
  updateAssetSchema,
  assetResponseSchema,
  assetListResponseSchema,
} from '../../domains/assets/schemas/asset.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Asset } from '../../domains/assets/entities/Asset.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const budgetIdParam = z.object({ id: z.string() });
const assetParams = z.object({ id: z.string(), aid: z.string() });

function toAssetResponse(a: Asset) {
  return {
    id: a.id,
    budgetId: a.budgetId,
    type: a.type,
    name: a.name,
    currentValue: a.currentValue,
    acquisitionDate: a.acquisitionDate.toISOString(),
    annualGrowthRate: a.annualGrowthRate,
    loanDetailId: a.loanDetailId,
    sourceRevenueId: a.sourceRevenueId,
    sourceExpenseId: a.sourceExpenseId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

const listRoute = createRoute({
  method: 'get',
  path: '/{id}/assets',
  tags: ['Assets'],
  summary: 'List assets in a budget',
  request: { params: budgetIdParam },
  responses: {
    200: {
      content: { 'application/json': { schema: assetListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/{id}/assets',
  tags: ['Assets'],
  summary: 'Create an asset',
  request: {
    params: budgetIdParam,
    body: { content: { 'application/json': { schema: createAssetSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: assetResponseSchema } },
      description: 'Created',
    },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}/assets/{aid}',
  tags: ['Assets'],
  summary: 'Update an asset',
  request: {
    params: assetParams,
    body: { content: { 'application/json': { schema: updateAssetSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: assetResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}/assets/{aid}',
  tags: ['Assets'],
  summary: 'Delete an asset',
  request: { params: assetParams },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createAssetController(authMiddleware: MiddlewareHandler) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.get('user').id;
    const useCase = container.resolve(ListAssetsUseCase);
    const assets = await useCase.execute(id, userId);
    return c.json(assets.map(toAssetResponse), 200);
  });

  app.openapi(createRoute_, async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('user').id;
    const useCase = container.resolve(CreateAssetUseCase);
    const asset = await useCase.execute(id, userId, {
      type: body.type,
      name: body.name,
      currentValue: body.currentValue,
      acquisitionDate: new Date(body.acquisitionDate),
      annualGrowthRate: body.annualGrowthRate,
      loanDetailId: body.loanDetailId,
      sourceRevenueId: body.sourceRevenueId,
      sourceExpenseId: body.sourceExpenseId,
    });
    return c.json(toAssetResponse(asset), 201);
  });

  app.openapi(updateRoute, async (c) => {
    const { id, aid } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('user').id;
    const useCase = container.resolve(UpdateAssetUseCase);
    const asset = await useCase.execute(id, userId, aid, {
      type: body.type,
      name: body.name,
      currentValue: body.currentValue,
      acquisitionDate: body.acquisitionDate ? new Date(body.acquisitionDate) : undefined,
      annualGrowthRate: body.annualGrowthRate,
      loanDetailId: body.loanDetailId,
      sourceRevenueId: body.sourceRevenueId,
      sourceExpenseId: body.sourceExpenseId,
    });
    return c.json(toAssetResponse(asset), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const { id, aid } = c.req.valid('param');
    const userId = c.get('user').id;
    const useCase = container.resolve(DeleteAssetUseCase);
    await useCase.execute(id, userId, aid);
    return c.body(null, 204);
  });

  return app;
}
