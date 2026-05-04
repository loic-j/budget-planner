import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { AcceptInviteUseCase } from '../../domains/budget/usecases/AcceptInviteUseCase.js';
import { PreviewInviteUseCase } from '../../domains/budget/usecases/PreviewInviteUseCase.js';
import {
  invitePreviewSchema,
  memberResponseSchema,
} from '../../domains/budget/schemas/member.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { BudgetMember } from '../../domains/budget/entities/BudgetMember.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const tokenParam = z.object({ token: z.string() });

function toMemberResponse(m: BudgetMember) {
  return {
    id: m.id,
    budgetId: m.budgetId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    userEmail: m.userEmail,
    userName: m.userName,
  };
}

const previewRoute = createRoute({
  method: 'get',
  path: '/{token}',
  tags: ['Invites'],
  summary: 'Preview an invite link (no auth required)',
  request: { params: tokenParam },
  responses: {
    200: { content: { 'application/json': { schema: invitePreviewSchema } }, description: 'OK' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const acceptRoute = createRoute({
  method: 'post',
  path: '/{token}',
  tags: ['Invites'],
  summary: 'Accept an invite link (auth required)',
  request: { params: tokenParam },
  responses: {
    200: { content: { 'application/json': { schema: memberResponseSchema } }, description: 'OK' },
    400: {
      content: { 'application/json': { schema: errorSchema } },
      description: 'Validation error',
    },
    401: { content: { 'application/json': { schema: errorSchema } }, description: 'Unauthorized' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
    409: {
      content: { 'application/json': { schema: errorSchema } },
      description: 'Already a member',
    },
  },
});

export function createInviteController(authMiddleware: MiddlewareHandler<AppEnv>) {
  const app = new OpenAPIHono<AppEnv>();

  app.openapi(previewRoute, async (c) => {
    const { token } = c.req.valid('param');
    const useCase = container.resolve(PreviewInviteUseCase);
    const preview = await useCase.execute(token);
    return c.json(preview, 200);
  });

  // auth applied per-route for POST only
  app.use('/:token', async (c, next) => {
    if (c.req.method === 'POST') {
      return authMiddleware(c, next);
    }
    return next();
  });

  app.openapi(acceptRoute, async (c) => {
    const user = c.get('user');
    const { token } = c.req.valid('param');
    const useCase = container.resolve(AcceptInviteUseCase);
    const member = await useCase.execute(token, user.id);
    return c.json(toMemberResponse(member), 200);
  });

  return app;
}
