import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { createPrismaClient } from '../infrastructure/database/prisma.client.js';
import { PrismaBudgetRepository } from '../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';

const prisma = createPrismaClient();
container.registerInstance(PrismaClient, prisma);
container.registerInstance('Logger', logger);
container.register('IBudgetRepository', { useClass: PrismaBudgetRepository });
container.register('IBudgetMemberRepository', { useClass: PrismaBudgetMemberRepository });
container.register('IBudgetInviteRepository', { useClass: PrismaBudgetInviteRepository });

export { container, prisma };
