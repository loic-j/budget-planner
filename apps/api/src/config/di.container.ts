import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { createPrismaClient } from '../infrastructure/database/prisma.client.js';

const prisma = createPrismaClient();
container.registerInstance(PrismaClient, prisma);
container.registerInstance('Logger', logger);

export { container, prisma };
