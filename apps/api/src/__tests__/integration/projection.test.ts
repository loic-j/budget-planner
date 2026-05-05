import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createExpenseController } from '../../controllers/expense/ExpenseController.js';
import { createRevenueController } from '../../controllers/revenue/RevenueController.js';
import { createProjectionController } from '../../controllers/projection/ProjectionController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { PrismaExpenseRepository } from '../../infrastructure/database/repositories/PrismaExpenseRepository.js';
import { PrismaLoanDetailRepository } from '../../infrastructure/database/repositories/PrismaLoanDetailRepository.js';
import { PrismaLoanPaymentRepository } from '../../infrastructure/database/repositories/PrismaLoanPaymentRepository.js';
import { PrismaRevenueRepository } from '../../infrastructure/database/repositories/PrismaRevenueRepository.js';
import { PrismaSavingRepository } from '../../infrastructure/database/repositories/PrismaSavingRepository.js';
import { PrismaAssetRepository } from '../../infrastructure/database/repositories/PrismaAssetRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `proj-owner-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let budgetId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createExpenseController(authMiddleware));
  a.route('/api/budgets', createRevenueController(authMiddleware));
  a.route('/api/budgets', createProjectionController(authMiddleware));
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
  container.register('IExpenseRepository', { useClass: PrismaExpenseRepository });
  container.register('ILoanDetailRepository', { useClass: PrismaLoanDetailRepository });
  container.register('ILoanPaymentRepository', { useClass: PrismaLoanPaymentRepository });
  container.register('IRevenueRepository', { useClass: PrismaRevenueRepository });
  container.register('ISavingRepository', { useClass: PrismaSavingRepository });
  container.register('IAssetRepository', { useClass: PrismaAssetRepository });

  const authInstance = createAuthInstance(prisma);
  app = buildApp(authInstance);

  const r1 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: PASSWORD, name: 'Owner' }),
  });
  ownerToken = ((await r1.json()) as { token: string }).token;

  // Budget: 2026-01-01 to 2026-12-31 (12 months)
  const rb = await app.request('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
    body: JSON.stringify({
      name: 'Projection Test Budget',
      currency: 'EUR',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      initialSaving: 1000,
    }),
  });
  budgetId = ((await rb.json()) as { id: string }).id;

  // Add monthly revenue of 3000
  await app.request(`/api/budgets/${budgetId}/revenues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
    body: JSON.stringify({ name: 'Salary', amount: 3000, frequency: 'MONTHLY' }),
  });

  // Add monthly expense of 1000
  await app.request(`/api/budgets/${budgetId}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
    body: JSON.stringify({ type: 'REGULAR', name: 'Rent', amount: 1000, frequency: 'MONTHLY' }),
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Projection API', () => {
  it('GET /projection — returns 12 monthly points', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/projection`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { points: unknown[]; persons: unknown[] };
    expect(body.points).toHaveLength(12);
  });

  it('GET /projection — first point has correct revenue and expense', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/projection`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as {
      points: { revenue: number; expense: number; cashBalance: number }[];
    };
    const first = body.points[0];
    expect(first.revenue).toBe(3000);
    expect(first.expense).toBe(1000);
    // cashBalance = initialSaving(1000) + revenue(3000) - expense(1000) = 3000
    expect(first.cashBalance).toBe(3000);
  });

  it('GET /projection?granularity=yearly — returns 1 yearly point', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/projection?granularity=yearly`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { points: { revenue: number }[] };
    expect(body.points).toHaveLength(1);
    // 12 months × 3000 = 36000
    expect(body.points[0].revenue).toBe(36000);
  });

  it('GET /projection — cumulative cashBalance grows each month', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/projection`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as { points: { cashBalance: number }[] };
    const balances = body.points.map((p) => p.cashBalance);
    for (let i = 1; i < balances.length; i++) {
      expect(balances[i]).toBeGreaterThan(balances[i - 1]);
    }
  });

  it('GET /projection — netWorth = cashBalance when no assets/loans', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/projection`, {
      headers: auth(ownerToken),
    });
    const body = (await res.json()) as {
      points: { cashBalance: number; savingsBalance: number; netWorth: number }[];
    };
    for (const p of body.points) {
      expect(p.netWorth).toBe(p.cashBalance + p.savingsBalance);
    }
  });
});
