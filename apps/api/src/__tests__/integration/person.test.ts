import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createPersonController } from '../../controllers/person/PersonController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `person-owner-${Date.now()}@example.com`;
const VIEWER_EMAIL = `person-viewer-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let viewerToken: string;
let ownerId: string;
let budgetId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createPersonController(authMiddleware));
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

  const authInstance = createAuthInstance(prisma);
  app = buildApp(authInstance);

  const r1 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: PASSWORD, name: 'Owner' }),
  });
  const b1 = (await r1.json()) as { token: string; user: { id: string } };
  ownerToken = b1.token;
  ownerId = b1.user.id;

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
      name: 'Person Test Budget',
      currency: 'EUR',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
      initialSaving: 0,
    }),
  });
  budgetId = ((await rb.json()) as { id: string }).id;
});

afterAll(async () => {
  await prisma.budget.deleteMany({ where: { ownerId } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, VIEWER_EMAIL] } } });
  await prisma.$disconnect();
});

describe('GET /api/budgets/:id/persons', () => {
  it('returns empty list initially', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('returns 403 for non-members', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      headers: auth(viewerToken),
    });
    expect(res.status).toBe(403);
  });
});

describe('Person CRUD', () => {
  let personId: string;
  let childId: string;

  it('creates an adult person', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'ADULT',
        name: 'Alice',
        sex: 'FEMALE',
        dob: '1990-06-15T00:00:00.000Z',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; type: string; age: number };
    expect(body.type).toBe('ADULT');
    expect(body.age).toBeGreaterThan(0);
    personId = body.id;
  });

  it('creates a planned child (plannedDob only)', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'CHILD',
        name: 'Baby',
        sex: 'OTHER',
        plannedDob: new Date(Date.now() + 180 * 86400000).toISOString(),
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; plannedDob: string; dob: null };
    expect(body.dob).toBeNull();
    expect(body.plannedDob).toBeTruthy();
    childId = body.id;
  });

  it('rejects adult without dob', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ type: 'ADULT', name: 'Bob', sex: 'MALE' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects child with both dob and plannedDob', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'CHILD',
        name: 'Bob',
        sex: 'MALE',
        dob: '2020-01-01T00:00:00.000Z',
        plannedDob: '2020-01-01T00:00:00.000Z',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('lists 2 persons after creation', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as unknown[];
    expect(body).toHaveLength(2);
  });

  it('updates person name', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ name: 'Alice Updated' }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { name: string }).name).toBe('Alice Updated');
  });

  it('deletes a person', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons/${childId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(204);
  });

  it('lists 1 person after delete', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/persons`, {
      headers: auth(ownerToken),
    });
    expect(((await res.json()) as unknown[]).length).toBe(1);
  });
});
