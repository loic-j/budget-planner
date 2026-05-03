import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaClient } from '@prisma/client';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createAuthInstance } from '../../config/auth.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { DomainError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const TEST_EMAIL = `test-auth-${Date.now()}@example.com`;
const TEST_EMAIL_2 = `test-auth-2-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const TEST_NAME = 'Test User';

let prisma: PrismaClient;
let auth: ReturnType<typeof createAuthInstance>;

beforeAll(async () => {
  prisma = new PrismaClient();
  auth = createAuthInstance(prisma);
  // Pre-create a user for sign-in / duplicate tests
  const app = buildApp();
  await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL_2, password: TEST_PASSWORD, name: TEST_NAME }),
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_EMAIL, TEST_EMAIL_2] } },
  });
  await prisma.$disconnect();
});

function buildApp() {
  const app = new OpenAPIHono<AppEnv>();

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  const authMiddleware = createAuthMiddleware(auth);
  app.get('/protected', authMiddleware, (c) => c.json({ ok: true }));

  app.onError((err, c) => {
    if (err instanceof DomainError) {
      return c.json({ error: err.message, code: err.code }, err.statusCode as ContentfulStatusCode);
    }
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}

describe('POST /api/auth/sign-up/email', () => {
  it('creates a user, auto-signs in, and returns a token', async () => {
    const app = buildApp();
    const res = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; user: { email: string } };
    expect(body).toHaveProperty('token');
    expect(body.user.email).toBe(TEST_EMAIL);
  });

  it('returns 422 for duplicate email', async () => {
    const app = buildApp();
    const res = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL_2, password: TEST_PASSWORD, name: TEST_NAME }),
    });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/sign-in/email', () => {
  it('succeeds and returns a session token', async () => {
    const app = buildApp();
    const res = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL_2, password: TEST_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; user: { email: string } };
    expect(body).toHaveProperty('token');
    expect(body.user.email).toBe(TEST_EMAIL_2);
  });

  it('returns 401 for wrong password', async () => {
    const app = buildApp();
    const res = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL_2, password: 'WrongPass999!' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('Auth middleware', () => {
  it('returns 401 for unauthenticated requests to protected routes', async () => {
    const app = buildApp();
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('UNAUTHORIZED');
  });
});
