import type { AuthInstance } from '../config/auth.js';

export type BetterAuthUser = AuthInstance['$Infer']['Session']['user'];
export type BetterAuthSession = AuthInstance['$Infer']['Session']['session'];

export type AppEnv = {
  Variables: {
    user: BetterAuthUser;
    session: BetterAuthSession;
  };
};
