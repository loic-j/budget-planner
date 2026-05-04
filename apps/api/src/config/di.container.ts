import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { createPrismaClient } from '../infrastructure/database/prisma.client.js';
import { PrismaBudgetRepository } from '../infrastructure/database/repositories/PrismaBudgetRepository.js';
import { PrismaBudgetMemberRepository } from '../infrastructure/database/repositories/PrismaBudgetMemberRepository.js';
import { PrismaBudgetInviteRepository } from '../infrastructure/database/repositories/PrismaBudgetInviteRepository.js';
import { PrismaPersonRepository } from '../infrastructure/database/repositories/PrismaPersonRepository.js';
import { PrismaCategoryRepository } from '../infrastructure/database/repositories/PrismaCategoryRepository.js';

const prisma = createPrismaClient();
container.registerInstance(PrismaClient, prisma);
container.registerInstance('Logger', logger);
container.register('IBudgetRepository', { useClass: PrismaBudgetRepository });
container.register('IBudgetMemberRepository', { useClass: PrismaBudgetMemberRepository });
container.register('IBudgetInviteRepository', { useClass: PrismaBudgetInviteRepository });
container.register('IPersonRepository', { useClass: PrismaPersonRepository });
container.register('ICategoryRepository', { useClass: PrismaCategoryRepository });

export { container, prisma };
