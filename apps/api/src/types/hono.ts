import type { User, Session } from 'better-auth';

export type AppEnv = {
  Variables: {
    user: User & { role?: string | null };
    session: Session;
  };
};
