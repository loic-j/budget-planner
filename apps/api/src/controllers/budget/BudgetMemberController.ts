import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListMembersUseCase } from '../../domains/budget/usecases/ListMembersUseCase.js';
import { ChangeMemberRoleUseCase } from '../../domains/budget/usecases/ChangeMemberRoleUseCase.js';
import { RemoveMemberUseCase } from '../../domains/budget/usecases/RemoveMemberUseCase.js';
import { LeaveBudgetUseCase } from '../../domains/budget/usecases/LeaveBudgetUseCase.js';
import { ListInvitesUseCase } from '../../domains/budget/usecases/ListInvitesUseCase.js';
import { CreateInviteUseCase } from '../../domains/budget/usecases/CreateInviteUseCase.js';
import { RevokeInviteUseCase } from '../../domains/budget/usecases/RevokeInviteUseCase.js';
import {
  memberListResponseSchema,
  memberResponseSchema,
  changeMemberRoleSchema,
  inviteListResponseSchema,
  inviteResponseSchema,
  createInviteSchema,
} from '../../domains/budget/schemas/member.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { BudgetMember } from '../../domains/budget/entities/BudgetMember.js';
import type { BudgetInvite } from '../../domains/budget/entities/BudgetInvite.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const idParam = z.object({ id: z.string() });
const idAndUserParam = z.object({ id: z.string(), userId: z.string() });
const idAndInviteParam = z.object({ id: z.string(), inviteId: z.string() });

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

function toInviteResponse(i: BudgetInvite) {
  return {
    id: i.id,
    budgetId: i.budgetId,
    token: i.token,
    role: i.role,
    createdBy: i.createdBy,
    createdAt: i.createdAt.toISOString(),
    expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
    maxUses: i.maxUses,
    useCount: i.useCount,
    isExpired: i.isExpired,
    isMaxUsesReached: i.isMaxUsesReached,
  };
}

const listMembersRoute = createRoute({
  method: 'get',
  path: '/{id}/members',
  tags: ['Members'],
  summary: 'List all members of a budget',
  request: { params: idParam },
  responses: {
    200: {
      content: { 'application/json': { schema: memberListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const leaveRoute = createRoute({
  method: 'delete',
  path: '/{id}/members/me',
  tags: ['Members'],
  summary: 'Leave a budget',
  request: { params: idParam },
  responses: {
    204: { description: 'Left' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const changeRoleRoute = createRoute({
  method: 'patch',
  path: '/{id}/members/{userId}/role',
  tags: ['Members'],
  summary: 'Change a member role',
  request: {
    params: idAndUserParam,
    body: { content: { 'application/json': { schema: changeMemberRoleSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: memberResponseSchema } }, description: 'OK' },
    400: {
      content: { 'application/json': { schema: errorSchema } },
      description: 'Validation error',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const removeMemberRoute = createRoute({
  method: 'delete',
  path: '/{id}/members/{userId}',
  tags: ['Members'],
  summary: 'Remove a member from a budget',
  request: { params: idAndUserParam },
  responses: {
    204: { description: 'Removed' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const listInvitesRoute = createRoute({
  method: 'get',
  path: '/{id}/invites',
  tags: ['Invites'],
  summary: 'List all active invite links for a budget',
  request: { params: idParam },
  responses: {
    200: {
      content: { 'application/json': { schema: inviteListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const createInviteRoute = createRoute({
  method: 'post',
  path: '/{id}/invites',
  tags: ['Invites'],
  summary: 'Create an invite link for a budget',
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: createInviteSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: inviteResponseSchema } },
      description: 'Created',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const revokeInviteRoute = createRoute({
  method: 'delete',
  path: '/{id}/invites/{inviteId}',
  tags: ['Invites'],
  summary: 'Revoke an invite link',
  request: { params: idAndInviteParam },
  responses: {
    204: { description: 'Revoked' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createBudgetMemberController(authMiddleware: MiddlewareHandler<AppEnv>) {
  const app = new OpenAPIHono<AppEnv>();

  app.use('*', authMiddleware);

  app.openapi(listMembersRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(ListMembersUseCase);
    const members = await useCase.execute(id, user.id);
    return c.json(members.map(toMemberResponse), 200);
  });

  // leave must be registered before :userId to avoid 'me' being captured as param
  app.openapi(leaveRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(LeaveBudgetUseCase);
    await useCase.execute(id, user.id);
    return c.body(null, 204);
  });

  app.openapi(changeRoleRoute, async (c) => {
    const user = c.get('user');
    const { id, userId } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const useCase = container.resolve(ChangeMemberRoleUseCase);
    const member = await useCase.execute(id, user.id, userId, role);
    return c.json(toMemberResponse(member), 200);
  });

  app.openapi(removeMemberRoute, async (c) => {
    const user = c.get('user');
    const { id, userId } = c.req.valid('param');
    const useCase = container.resolve(RemoveMemberUseCase);
    await useCase.execute(id, user.id, userId);
    return c.body(null, 204);
  });

  app.openapi(listInvitesRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(ListInvitesUseCase);
    const invites = await useCase.execute(id, user.id);
    return c.json(invites.map(toInviteResponse), 200);
  });

  app.openapi(createInviteRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(CreateInviteUseCase);
    const invite = await useCase.execute({ budgetId: id, requesterId: user.id, ...body });
    return c.json(toInviteResponse(invite), 201);
  });

  app.openapi(revokeInviteRoute, async (c) => {
    const user = c.get('user');
    const { id, inviteId } = c.req.valid('param');
    const useCase = container.resolve(RevokeInviteUseCase);
    await useCase.execute(id, user.id, inviteId);
    return c.body(null, 204);
  });

  return app;
}
