import { createApp } from './app.js';
import { initializeOpenTelemetry } from './config/otel.js';

initializeOpenTelemetry();

const app = createApp();

export default app;
