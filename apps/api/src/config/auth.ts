import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

export function createAuthInstance(prisma: PrismaClient) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
      process.env.FRONTEND_URL,
      process.env.BETTER_AUTH_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean) as string[],
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          input: false,
          returned: true,
        },
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuthInstance>;
