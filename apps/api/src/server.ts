import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { initializeOpenTelemetry } from './config/otel.js';

initializeOpenTelemetry();

const app = createApp();
const port = parseInt(process.env.PORT || '3000');

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  }
);
