import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const HelloResponseSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
});

const helloRoute = createRoute({
  method: 'get',
  path: '/hello',
  tags: ['Health'],
  summary: 'Hello World',
  responses: {
    200: {
      content: { 'application/json': { schema: HelloResponseSchema } },
      description: 'Hello from Budget Planner API',
    },
  },
});

export function createHelloController() {
  const app = new OpenAPIHono();

  app.openapi(helloRoute, (c) => {
    return c.json({
      message: 'Hello from Budget Planner API!',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
