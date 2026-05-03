import { hc } from 'hono/client';
import type { AppType } from '../../api/src/app.js';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

export const apiClient = hc<AppType>(baseUrl);
