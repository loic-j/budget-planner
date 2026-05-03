import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { Scalar } from '@scalar/hono-api-reference';
import { pinoLogger } from 'hono-pino';
import { logger } from './config/logger.js';
import { createHelloController } from './controllers/hello/HelloController.js';

export function createApp() {
  const app = new OpenAPIHono();

  const allowedOrigins = [
    process.env.FRONTEND_URL,
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

  const routes = app.route('/api', createHelloController());

  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Budget Planner API', version: '1.0.0' },
  });

  app.get('/api/docs', Scalar({ url: '/api/openapi.json', theme: 'default' }));

  app.onError((err, c) => {
    logger.error({ err }, 'Unhandled error');
    return c.json({ error: 'Internal server error' }, 500);
  });

  return routes;
}

export type AppType = ReturnType<typeof createApp>;
