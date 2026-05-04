import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { Scalar } from '@scalar/hono-api-reference';
import { pinoLogger } from 'hono-pino';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { logger } from './config/logger.js';
import { prisma } from './config/di.container.js';
import { createAuthInstance } from './config/auth.js';
import { createHelloController } from './controllers/hello/HelloController.js';
import { createBudgetController } from './controllers/budget/BudgetController.js';
import { createBudgetMemberController } from './controllers/budget/BudgetMemberController.js';
import { createInviteController } from './controllers/invite/InviteController.js';
import { createPersonController } from './controllers/person/PersonController.js';
import { createCategoryController } from './controllers/category/CategoryController.js';
import { createExpenseController } from './controllers/expense/ExpenseController.js';
import { createRevenueController } from './controllers/revenue/RevenueController.js';
import { createSavingController } from './controllers/saving/SavingController.js';
import { createAssetController } from './controllers/asset/AssetController.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import { DomainError } from './infrastructure/errors/DomainError.js';
import type { AppEnv } from './types/hono.js';

export function createApp() {
  const auth = createAuthInstance(prisma);

  const app = new OpenAPIHono<AppEnv>();

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.BETTER_AUTH_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean) as string[];

  app.use(
    '*',
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['Set-Cookie'],
    })
  );

  app.use('*', pinoLogger({ pino: logger }));

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Better Auth — handles all /api/auth/* endpoints
  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  const authMiddleware = createAuthMiddleware(auth);

  const routes = app
    .route('/api', createHelloController())
    .route('/api/budgets', createBudgetController(authMiddleware))
    .route('/api/budgets', createBudgetMemberController(authMiddleware))
    .route('/api/invite', createInviteController(authMiddleware))
    .route('/api/budgets', createPersonController(authMiddleware))
    .route('/api/budgets', createCategoryController(authMiddleware))
    .route('/api/budgets', createExpenseController(authMiddleware))
    .route('/api/budgets', createRevenueController(authMiddleware))
    .route('/api/budgets', createSavingController(authMiddleware))
    .route('/api/budgets', createAssetController(authMiddleware));

  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Budget Planner API', version: '1.0.0' },
  });

  app.get('/api/docs', Scalar({ url: '/api/openapi.json', theme: 'default' }));

  app.onError((err, c) => {
    if (err instanceof DomainError) {
      return c.json({ error: err.message, code: err.code }, err.statusCode as ContentfulStatusCode);
    }
    logger.error({ err }, 'Unhandled error');
    return c.json({ error: 'Internal server error' }, 500);
  });

  return routes;
}

export type AppType = ReturnType<typeof createApp>;
