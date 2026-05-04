import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const TEST_EMAIL = `budget-test-${Date.now()}@example.com`;
const TEST_EMAIL_2 = `budget-test-2-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let token: string;
let token2: string;
let userId: string;
let userId2: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));

  a.onError((err, c) => {
    if (err instanceof DomainError) {
      return c.json({ error: err.message, code: err.code }, err.statusCode as ContentfulStatusCode);
    }
    return c.json({ error: 'Internal server error' }, 500);
  });

  return a;
}

beforeAll(async () => {
  prisma = new PrismaClient();

  // Register repo in container for this test
  container.registerInstance(PrismaClient, prisma);
  container.register('IBudgetRepository', { useClass: PrismaBudgetRepository });

  const auth = createAuthInstance(prisma);
  app = buildApp(auth);

  // Create + sign in user 1
  const r1 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Owner' }),
  });
  const b1 = (await r1.json()) as { token: string; user: { id: string } };
  token = b1.token;
  userId = b1.user.id;

  // Create + sign in user 2
  const r2 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL_2, password: TEST_PASSWORD, name: 'Other' }),
  });
  const b2 = (await r2.json()) as { token: string; user: { id: string } };
  token2 = b2.token;
  userId2 = b2.user.id;
});

afterAll(async () => {
  await prisma.budget.deleteMany({ where: { ownerId: { in: [userId, userId2] } } });
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, TEST_EMAIL_2] } } });
  await prisma.$disconnect();
});

function authHeader(t: string) {
  return { Authorization: `Bearer ${t}` };
}

describe('GET /api/budgets', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/budgets');
    expect(res.status).toBe(401);
  });

  it('returns empty list for new user', async () => {
    const res = await app.request('/api/budgets', { headers: authHeader(token2) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body).toEqual([]);
  });
});

describe('POST /api/budgets', () => {
  it('creates a budget and returns 201', async () => {
    const res = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({
        name: 'My First Budget',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        currency: 'EUR',
        initialSaving: 1000,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; name: string; ownerId: string };
    expect(body.name).toBe('My First Budget');
    expect(body.ownerId).toBe(userId);
    expect(body).toHaveProperty('id');
  });

  it('returns 400 when endDate is before startDate', async () => {
    const res = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({
        name: 'Bad',
        startDate: '2026-12-31T00:00:00.000Z',
        endDate: '2026-01-01T00:00:00.000Z',
        currency: 'EUR',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'X',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        currency: 'EUR',
      }),
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/budgets/:id', () => {
  let budgetId: string;

  beforeAll(async () => {
    const res = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({
        name: 'Get Test Budget',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        currency: 'EUR',
      }),
    });
    const body = (await res.json()) as { id: string };
    budgetId = body.id;
  });

  it('owner can get budget', async () => {
    const res = await app.request(`/api/budgets/${budgetId}`, {
      headers: authHeader(token),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body.id).toBe(budgetId);
    expect(body.name).toBe('Get Test Budget');
  });

  it('non-member gets 403', async () => {
    const res = await app.request(`/api/budgets/${budgetId}`, {
      headers: authHeader(token2),
    });
    expect(res.status).toBe(403);
  });

  it('unknown budget returns 404', async () => {
    const res = await app.request('/api/budgets/nonexistent-id', {
      headers: authHeader(token),
    });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/budgets/:id', () => {
  let budgetId: string;

  beforeAll(async () => {
    const res = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({
        name: 'Patch Test',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        currency: 'EUR',
      }),
    });
    const body = (await res.json()) as { id: string };
    budgetId = body.id;
  });

  it('owner can update name', async () => {
    const res = await app.request(`/api/budgets/${budgetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ name: 'Renamed Budget' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string };
    expect(body.name).toBe('Renamed Budget');
  });

  it('non-member gets 403', async () => {
    const res = await app.request(`/api/budgets/${budgetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token2) },
      body: JSON.stringify({ name: 'Hack' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/budgets/:id', () => {
  it('owner can delete budget', async () => {
    const create = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({
        name: 'To Delete',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        currency: 'EUR',
      }),
    });
    const { id } = (await create.json()) as { id: string };

    const del = await app.request(`/api/budgets/${id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    expect(del.status).toBe(204);

    // confirm gone
    const get = await app.request(`/api/budgets/${id}`, { headers: authHeader(token) });
    expect(get.status).toBe(404);
  });

  it('non-member gets 403', async () => {
    const create = await app.request('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({
        name: 'No Delete',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        currency: 'EUR',
      }),
    });
    const { id } = (await create.json()) as { id: string };

    const del = await app.request(`/api/budgets/${id}`, {
      method: 'DELETE',
      headers: authHeader(token2),
    });
    expect(del.status).toBe(403);
  });
});
