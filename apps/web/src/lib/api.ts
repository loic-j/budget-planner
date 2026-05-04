import { hc } from 'hono/client';
import type { AppType } from '../../../api/src/app.js';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

// TODO: cross-project type inference partially broken in monorepo (tsyringe+OpenAPIHono chaining).
// AppType is correct at runtime; fix with proper project references when needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiClient = hc<AppType>(baseUrl, { init: { credentials: 'include' } }) as any;
