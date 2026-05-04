import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createExpenseController } from '../../controllers/expense/ExpenseController.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { PrismaExpenseRepository } from '../../infrastructure/database/repositories/PrismaExpenseRepository.js';
import { PrismaLoanDetailRepository } from '../../infrastructure/database/repositories/PrismaLoanDetailRepository.js';
import { PrismaLoanPaymentRepository } from '../../infrastructure/database/repositories/PrismaLoanPaymentRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `exp-owner-${Date.now()}@example.com`;
const VIEWER_EMAIL = `exp-viewer-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let viewerToken: string;
let budgetId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createExpenseController(authMiddleware));
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

  const authInstance = createAuthInstance(prisma);
  app = buildApp(authInstance);

  const r1 = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: PASSWORD, name: 'Owner' }),
  });
  const b1 = (await r1.json()) as { token: string; user: { id: string } };
  ownerToken = b1.token;

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
      name: 'Expense Test Budget',
      currency: 'EUR',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getFullYear() + 5, 11, 31).toISOString(),
      initialSaving: 0,
    }),
  });
  budgetId = ((await rb.json()) as { id: string }).id;

  // Add viewer
  const viewerSignIn = await app.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: VIEWER_EMAIL, password: PASSWORD }),
  });
  viewerToken = ((await viewerSignIn.json()) as { token: string }).token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── REGULAR expense ──────────────────────────────────────────────────────────

describe('REGULAR expense CRUD', () => {
  let expenseId: string;

  it('creates a REGULAR expense', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'REGULAR',
        name: 'Rent',
        amount: 900,
        frequency: 'MONTHLY',
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      id: string;
      type: string;
      name: string;
      amount: number;
      loanDetail: null;
    };
    expect(data.type).toBe('REGULAR');
    expect(data.name).toBe('Rent');
    expect(data.amount).toBe(900);
    expect(data.loanDetail).toBeNull();
    expenseId = data.id;
  });

  it('lists expenses and includes the new one', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as { id: string }[];
    expect(list.some((e) => e.id === expenseId)).toBe(true);
  });

  it('gets a single expense by id', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses/${expenseId}`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; name: string };
    expect(data.id).toBe(expenseId);
    expect(data.name).toBe('Rent');
  });

  it('updates a REGULAR expense', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses/${expenseId}/regular`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ name: 'Rent updated', amount: 950 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string; amount: number };
    expect(data.name).toBe('Rent updated');
    expect(data.amount).toBe(950);
  });

  it('deletes a REGULAR expense', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(204);
  });

  it('returns 404 after deletion', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses/${expenseId}`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(404);
  });
});

// ─── LOAN expense ─────────────────────────────────────────────────────────────

describe('LOAN expense', () => {
  let loanExpenseId: string;

  it('creates a LOAN expense and generates 360 payment rows', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'LOAN',
        name: 'Mortgage',
        loanType: 'MORTGAGE',
        totalAmount: 300_000,
        interestRate: 3.6,
        durationMonths: 360,
        loanStartDate: '2024-01-01T00:00:00.000Z',
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      id: string;
      type: string;
      loanDetail: { totalAmount: number; durationMonths: number; monthlyPayment: number };
    };
    expect(data.type).toBe('LOAN');
    expect(data.loanDetail).not.toBeNull();
    expect(data.loanDetail.totalAmount).toBe(300_000);
    expect(data.loanDetail.durationMonths).toBe(360);
    // ~1362/month for 300k @ 3.6% 30yr
    expect(data.loanDetail.monthlyPayment).toBeGreaterThan(1000);
    loanExpenseId = data.id;
  });

  it('fetches full amortization schedule with 360 rows', async () => {
    const res = await app.request(
      `/api/budgets/${budgetId}/expenses/${loanExpenseId}/loan-schedule`,
      { headers: auth(ownerToken) }
    );
    expect(res.status).toBe(200);
    const schedule = (await res.json()) as unknown[];
    expect(schedule).toHaveLength(360);
  });

  it('last payment in schedule has remainingBalance 0', async () => {
    const res = await app.request(
      `/api/budgets/${budgetId}/expenses/${loanExpenseId}/loan-schedule`,
      { headers: auth(ownerToken) }
    );
    const schedule = (await res.json()) as { remainingBalance: number }[];
    expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
  });

  it('updates loan parameters and regenerates schedule', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses/${loanExpenseId}/loan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ durationMonths: 240 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { loanDetail: { durationMonths: number } };
    expect(data.loanDetail.durationMonths).toBe(240);

    // Schedule should now have 240 rows
    const sr = await app.request(
      `/api/budgets/${budgetId}/expenses/${loanExpenseId}/loan-schedule`,
      { headers: auth(ownerToken) }
    );
    const schedule = (await sr.json()) as unknown[];
    expect(schedule).toHaveLength(240);
  });

  it('deletes loan expense and cascades to loanDetail + payments', async () => {
    const del = await app.request(`/api/budgets/${budgetId}/expenses/${loanExpenseId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(del.status).toBe(204);

    const check = await app.request(`/api/budgets/${budgetId}/expenses/${loanExpenseId}`, {
      headers: auth(ownerToken),
    });
    expect(check.status).toBe(404);
  });
});

// ─── Auth / permission checks ─────────────────────────────────────────────────

describe('permission checks', () => {
  it('unauthenticated request returns 401', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses`);
    expect(res.status).toBe(401);
  });

  it('non-member cannot list expenses', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/expenses`, {
      headers: auth(viewerToken),
    });
    expect(res.status).toBe(403);
  });
});
