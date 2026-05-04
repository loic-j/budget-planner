import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createCategoryController } from '../../controllers/category/CategoryController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { PRESET_CATEGORIES } from '../../domains/categories/constants/presetCategories.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `cat-owner-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let ownerId: string;
let budgetId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createCategoryController(authMiddleware));
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

  const rb = await app.request('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
    body: JSON.stringify({
      name: 'Category Test Budget',
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
  await prisma.user.deleteMany({ where: { email: OWNER_EMAIL } });
  await prisma.$disconnect();
});

describe('Preset seeding on budget creation', () => {
  it('seeds all preset categories on budget creation', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { isPreset: boolean }[];
    expect(body.length).toBe(PRESET_CATEGORIES.length);
    expect(body.every((c) => c.isPreset)).toBe(true);
  });

  it('filters categories by type', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories?type=EXPENSE`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as { type: string }[];
    expect(body.every((c) => c.type === 'EXPENSE')).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});

describe('Category CRUD', () => {
  let customCategoryId: string;

  it('creates a custom category', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ type: 'EXPENSE', name: 'Custom', icon: 'star' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; isPreset: boolean; name: string };
    expect(body.isPreset).toBe(false);
    expect(body.name).toBe('Custom');
    customCategoryId = body.id;
  });

  it('total count increased by 1 after custom category', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as unknown[];
    expect(body.length).toBe(PRESET_CATEGORIES.length + 1);
  });

  it('updates a category name', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories/${customCategoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ name: 'Custom Updated' }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { name: string }).name).toBe('Custom Updated');
  });

  it('deletes a category', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories/${customCategoryId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(204);
  });

  it('count back to preset count after delete', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories`, {
      headers: auth(ownerToken),
    });
    expect(((await res.json()) as unknown[]).length).toBe(PRESET_CATEGORIES.length);
  });

  it('returns 404 for unknown category', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/categories/nonexistent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(404);
  });
});
