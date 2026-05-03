import { createMiddleware } from 'hono/factory';
import type { AuthInstance } from '../config/auth.js';
import { UnauthorizedError } from '../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../types/hono.js';

export function createAuthMiddleware(auth: AuthInstance) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      throw new UnauthorizedError('Authentication required');
    }

    c.set('user', session.user);
    c.set('session', session.session);

    await next();
  });
}
