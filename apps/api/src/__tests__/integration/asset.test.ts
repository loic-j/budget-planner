import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { createBudgetController } from '../../controllers/budget/BudgetController.js';
import { createAssetController } from '../../controllers/asset/AssetController.js';
import { Asset } from '../../domains/assets/entities/Asset.js';
import { PrismaBudgetRepository } from '../../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/database/repositories/PrismaCategoryRepository.js';
import { PrismaAssetRepository } from '../../infrastructure/database/repositories/PrismaAssetRepository.js';
import { container } from 'tsyringe';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const OWNER_EMAIL = `asset-owner-${Date.now()}@example.com`;
const VIEWER_EMAIL = `asset-viewer-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let ownerToken: string;
let viewerToken: string;
let budgetId: string;
let assetId: string;

function buildApp(auth: ReturnType<typeof createAuthInstance>) {
  const a = new OpenAPIHono<AppEnv>();
  a.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const authMiddleware = createAuthMiddleware(auth);
  a.route('/api/budgets', createBudgetController(authMiddleware));
  a.route('/api/budgets', createAssetController(authMiddleware));
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
  container.register('IAssetRepository', { useClass: PrismaAssetRepository });

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
      name: 'Asset Test Budget',
      currency: 'EUR',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2030-12-31T00:00:00.000Z',
    }),
  });
  budgetId = ((await rb.json()) as { id: string }).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Assets API', () => {
  it('POST /assets — creates a real estate asset', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'REAL_ESTATE',
        name: 'Main apartment',
        currentValue: 250000,
        acquisitionDate: '2020-01-01T00:00:00.000Z',
        annualGrowthRate: 2.5,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      type: string;
      name: string;
      currentValue: number;
      annualGrowthRate: number;
    };
    expect(body.type).toBe('REAL_ESTATE');
    expect(body.name).toBe('Main apartment');
    expect(body.currentValue).toBe(250000);
    expect(body.annualGrowthRate).toBe(2.5);
    assetId = body.id;
  });

  it('GET /assets — lists assets', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets`, {
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /assets — rejects VIEWER', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(viewerToken) },
      body: JSON.stringify({
        type: 'OTHER',
        name: 'X',
        currentValue: 100,
        acquisitionDate: '2026-01-01T00:00:00.000Z',
        annualGrowthRate: 0,
      }),
    });
    expect(res.status).toBe(403);
  });

  it('POST /assets — creates vehicle with negative growth rate', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({
        type: 'VEHICLE',
        name: 'Car',
        currentValue: 20000,
        acquisitionDate: '2024-01-01T00:00:00.000Z',
        annualGrowthRate: -12,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { annualGrowthRate: number };
    expect(body.annualGrowthRate).toBe(-12);
  });

  it('PATCH /assets/:aid — updates growth rate', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets/${assetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ annualGrowthRate: 3.0 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { annualGrowthRate: number };
    expect(body.annualGrowthRate).toBe(3);
  });

  it('DELETE /assets/:aid — deletes asset', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets/${assetId}`, {
      method: 'DELETE',
      headers: auth(ownerToken),
    });
    expect(res.status).toBe(204);
  });

  it('PATCH /assets/:aid — 404 after delete', async () => {
    const res = await app.request(`/api/budgets/${budgetId}/assets/${assetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth(ownerToken) },
      body: JSON.stringify({ name: 'Ghost' }),
    });
    expect(res.status).toBe(404);
  });

  it('Asset.valueAt — appreciates correctly', () => {
    const asset = new Asset(
      'id',
      'bid',
      'REAL_ESTATE',
      'House',
      100000,
      new Date('2020-01-01'),
      10,
      new Date(),
      new Date()
    );
    const futureValue = asset.valueAt(new Date('2025-01-01'));
    // 100000 * 1.1^5 ≈ 161051
    expect(futureValue).toBeGreaterThan(160000);
    expect(futureValue).toBeLessThan(163000);
  });

  it('Asset.valueAt — floors at 0 when rate below -100%', () => {
    const asset = new Asset(
      'id',
      'bid',
      'VEHICLE',
      'Old car',
      5000,
      new Date('2020-01-01'),
      -150,
      new Date(),
      new Date()
    );
    // -150% → (1 - 1.5)^n = (-0.5)^n → negative for odd n → floored at 0
    expect(asset.valueAt(new Date('2021-01-01'))).toBe(0);
  });
});
