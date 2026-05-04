import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createRevenueController } from '../../controllers/revenue/RevenueController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { PrismaRevenueRepository } from '../../infrastructure/database/repositories/PrismaRevenueRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `rev-owner-${Date.now()}@example.com`;
const VIEWER_EMAIL = `rev-viewer-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let viewerToken: string;
let budgetId: string;
let revenueId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createRevenueController(authMiddleware));
  a.onError((err, c) => {
    if (err instanceof DomainError)
      return c.json({ error: err.message, code: err.code }, err.statusCode as ContentfulStatusCode);
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
  container.register('IPersonRepository', { useClass: PrismaPersonRepository });
  container.register('ICategoryRepository', { useClass: PrismaCategoryRepository });
  container.register('IRevenueRepository', { useClass: PrismaRevenueRepository });

  const authInstance = createAuthInstance(prisma);
  app = buildApp(authInstance);

  const r1 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: PASSWORD, name: 'Owner' }),
  });
  ownerToken = ((await r1.json()) as { token: string }).token;

  const r2 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: VIEWER_EMAIL, password: PASSWORD, name: 'Viewer' }),
  });
  viewerToken = ((await r2.json()) as { token: string }).token;

  const rb = await app.request('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
    body: JSON.stringify({
      name: 'Rev Test Budget',
      currency: 'EUR',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
    }),
  });
  budgetId = ((await rb.json()) as { id: string }).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Revenues API', () => {
  it('POST /revenues — creates a monthly salary revenue', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        name: 'Salary',
        amount: 3000,
        frequency: 'MONTHLY',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      name: string;
      amount: number;
      frequency: string;
    };
    expect(body.name).toBe('Salary');
    expect(body.amount).toBe(3000);
    expect(body.frequency).toBe('MONTHLY');
    revenueId = body.id;
  });

  it('GET /revenues — lists revenues', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /revenues — rejects VIEWER', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(viewerToken) },
      body: JSON.stringify({ name: 'X', amount: 100, frequency: 'MONTHLY' }),
    });
    expect(res.status).toBe(403);
  });

  it('POST /revenues — rejects non-member', async () => {
    const r = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `rev-nonmember-${Date.now()}@example.com`,
        password: PASSWORD,
        name: 'Stranger',
      }),
    });
    const stranger = ((await r.json()) as { token: string }).token;
    const res = await app.request(`/api/budgets/${budgetId}/revenues`, {
      headers: auth(stranger),
    });
    expect(res.status).toBe(403);
  });

  it('PATCH /revenues/:rid — updates amount', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues/${revenueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ amount: 3500 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number };
    expect(body.amount).toBe(3500);
  });

  it('POST /revenues — requires frequencyValue for EVERY_X_MONTHS', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ name: 'Bonus', amount: 500, frequency: 'EVERY_X_MONTHS' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /revenues — accepts EVERY_X_MONTHS with frequencyValue', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        name: 'Quarterly bonus',
        amount: 1500,
        frequency: 'EVERY_X_MONTHS',
        frequencyValue: 3,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { frequencyValue: number };
    expect(body.frequencyValue).toBe(3);
  });

  it('DELETE /revenues/:rid — deletes revenue', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues/${revenueId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(204);
  });

  it('PATCH /revenues/:rid — 404 after delete', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/revenues/${revenueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ amount: 999 }),
    });
    expect(res.status).toBe(404);
  });
});
