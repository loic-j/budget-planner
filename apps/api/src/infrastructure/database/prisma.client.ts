import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../../config/logger.js';

export function createPrismaClient() {
  const prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e: Prisma.QueryEvent) => {
      logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma Query');
    });
  }

  prisma.$on('error', (e: Prisma.LogEvent) => {
    logger.error({ error: e }, 'Prisma Error');
  });

  return prisma;
}
