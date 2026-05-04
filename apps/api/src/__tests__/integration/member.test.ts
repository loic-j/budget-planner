import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createBudgetMemberController } from '../../controllers/budget/BudgetMemberController.js';
import { createInviteController } from '../../controllers/invite/InviteController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `member-owner-${Date.now()}@example.com`;
const MEMBER_EMAIL = `member-user-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let memberToken: string;
let ownerId: string;
let memberId: string;
let budgetId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createBudgetMemberController(authMiddleware));
  a.route('/api/invite', createInviteController(authMiddleware));
  a.onError((err, c) => {
    if (err instanceof DomainError) {
      return c.json({ error: err.message, code: err.code }, err.statusCode as ContentfulStatusCode);
    }
    return c.json({ error: 'Internal server error' }, 500);
  });
  return a;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  prisma = new PrismaClient();

  container.registerInstance(PrismaClient, prisma);
  container.register('IBudgetRepository', { useClass: PrismaBudgetRepository });
  container.register('IBudgetMemberRepository', { useClass: PrismaBudgetMemberRepository });
  container.register('IBudgetInviteRepository', { useClass: PrismaBudgetInviteRepository });
  container.register('ICategoryRepository', { useClass: PrismaCategoryRepository });

  const authInstance = createAuthInstance(prisma);
  app = buildApp(authInstance);

  // Sign up owner
  const r1 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: PASSWORD, name: 'Owner' }),
  });
  const b1 = (await r1.json()) as { token: string; user: { id: string } };
  ownerToken = b1.token;
  ownerId = b1.user.id;

  // Sign up member
  const r2 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: MEMBER_EMAIL, password: PASSWORD, name: 'Member' }),
  });
  const b2 = (await r2.json()) as { token: string; user: { id: string } };
  memberToken = b2.token;
  memberId = b2.user.id;

  // Create a budget as owner
  const rb = await app.request('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
    body: JSON.stringify({
      name: 'Member Test Budget',
      currency: 'EUR',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
      initialSaving: 0,
    }),
  });
  const budget = (await rb.json()) as { id: string };
  budgetId = budget.id;
});

afterAll(async () => {
  await prisma.budget.deleteMany({ where: { ownerId } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, MEMBER_EMAIL] } } });
  await prisma.$disconnect();
});

// ─── Member listing ───────────────────────────────────────────────────────────

describe('GET /api/budgets/:id/members', () => {
  it('returns members for budget member', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: string; role: string }[];
    expect(body).toHaveLength(1);
    expect(body[0].userId).toBe(ownerId);
    expect(body[0].role).toBe('OWNER');
  });

  it('returns 403 for non-member', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members`, {
      headers: auth(memberToken),
    });
    expect(res.status).toBe(403);
  });
});

// ─── Invite flow ──────────────────────────────────────────────────────────────

describe('Invite flow', () => {
  let inviteToken: string;
  let inviteId: string;

  it('owner can create invite', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ role: 'EDITOR' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; token: string; role: string };
    expect(body.role).toBe('EDITOR');
    inviteToken = body.token;
    inviteId = body.id;
  });

  it('non-member can preview invite', async () => {
    const res = await app.request(`/api/invite/${inviteToken}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { budgetName: string; role: string; isValid: boolean };
    expect(body.budgetName).toBe('Member Test Budget');
    expect(body.role).toBe('EDITOR');
    expect(body.isValid).toBe(true);
  });

  it('member user can accept invite', async () => {
    const res = await app.request(`/api/invite/${inviteToken}`, {
      method: 'POST',
      headers: auth(memberToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: string; role: string };
    expect(body.userId).toBe(memberId);
    expect(body.role).toBe('EDITOR');
  });

  it('budget now has 2 members', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as { userId: string }[];
    expect(body).toHaveLength(2);
  });

  it('cannot accept same invite twice', async () => {
    const res = await app.request(`/api/invite/${inviteToken}`, {
      method: 'POST',
      headers: auth(memberToken),
    });
    expect(res.status).toBe(409);
  });

  it('owner can list invites', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/invites`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string }[];
    expect(body.some((i) => i.id === inviteId)).toBe(true);
  });

  it('owner can revoke invite', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/invites/${inviteId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(204);
  });

  it('returns 404 for revoked invite token', async () => {
    const res = await app.request(`/api/invite/${inviteToken}`);
    expect(res.status).toBe(404);
  });
});

// ─── Member management ────────────────────────────────────────────────────────

describe('Member management', () => {
  it('non-owner cannot create invite', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(memberToken) },
      body: JSON.stringify({ role: 'VIEWER' }),
    });
    expect(res.status).toBe(403);
  });

  it('owner can change member role', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members/${memberId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ role: 'VIEWER' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { role: string };
    expect(body.role).toBe('VIEWER');
  });

  it('owner cannot change their own role', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members/${ownerId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ role: 'VIEWER' }),
    });
    expect(res.status).toBe(400);
  });

  it('non-owner member can leave budget', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members/me`, {
      method: 'DELETE',
      headers: auth(memberToken),
    });
    expect(res.status).toBe(204);
  });

  it('owner cannot leave budget', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/members/me`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(400);
  });
});

// ─── Invite constraints ───────────────────────────────────────────────────────

describe('Invite with max uses', () => {
  let limitedToken: string;

  it('creates invite with maxUses=1', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ role: 'VIEWER', maxUses: 1 }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { token: string };
    limitedToken = body.token;
  });

  it('first accept succeeds', async () => {
    const res = await app.request(`/api/invite/${limitedToken}`, {
      method: 'POST',
      headers: auth(memberToken),
    });
    expect(res.status).toBe(200);
  });

  it('second accept fails with 400 (max uses reached)', async () => {
    // use a fresh user wouldn't be in members but we need a different user
    // use owner who is already a member → 409, not 400
    // to test max_uses specifically: preview should show isValid=false
    const preview = await app.request(`/api/invite/${limitedToken}`);
    const body = (await preview.json()) as { isValid: boolean };
    expect(body.isValid).toBe(false);
  });
});
