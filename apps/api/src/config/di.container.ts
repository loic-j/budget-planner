import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { createPrismaClient } from '../infrastructure/database/prisma.client.js';
import { PrismaBudgetRepository } from '../infrastructure/database/repositories/PrismaBudgetRepository.js';

const prisma = createPrismaClient();
container.registerInstance(PrismaClient, prisma);
container.registerInstance('Logger', logger);
container.register('IBudgetRepository', { useClass: PrismaBudgetRepository });

export { container, prisma };
