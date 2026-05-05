import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { projectionResponseSchema } from '../../domains/projection/schemas/projection.schema.js';
import { ProjectionService } from '../../domains/projection/services/ProjectionService.js';
import type { IBudgetRepository } from '../../domains/budget/repositories/IBudgetRepository.js';
import type { IBudgetMemberRepository } from '../../domains/budget/repositories/IBudgetMemberRepository.js';
import type { IExpenseRepository } from '../../domains/expenses/repositories/IExpenseRepository.js';
import type { IRevenueRepository } from '../../domains/revenues/repositories/IRevenueRepository.js';
import type { ISavingRepository } from '../../domains/savings/repositories/ISavingRepository.js';
import type { IAssetRepository } from '../../domains/assets/repositories/IAssetRepository.js';
import type { IPersonRepository } from '../../domains/person/repositories/IPersonRepository.js';
import type { ILoanPaymentRepository } from '../../domains/expenses/repositories/ILoanPaymentRepository.js';
import { ForbiddenError, NotFoundError } from '../../infrastructure/errors/DomainError.js';
import type { AppEnv } from '../../types/hono.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });

const projectionRoute = createRoute({
  method: 'get',
  path: '/{id}/projection',
  tags: ['Projection'],
  summary: 'Get budget projection',
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      granularity: z.enum(['monthly', 'yearly']).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: projectionResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createProjectionController(authMiddleware: MiddlewareHandler) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(projectionRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { granularity = 'monthly', from, to } = c.req.valid('query');
    const userId = c.get('user').id;

    const memberRepo = container.resolve<IBudgetMemberRepository>('IBudgetMemberRepository');
    const member = await memberRepo.findByBudgetAndUser(id, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');

    const budgetRepo = container.resolve<IBudgetRepository>('IBudgetRepository');
    const budget = await budgetRepo.findById(id);
    if (!budget) throw new NotFoundError(`Budget ${id} not found`);

    const startDate = from ? new Date(from) : budget.startDate;
    const endDate = to ? new Date(to) : budget.endDate;

    const [expenses, revenues, savings, assets, persons] = await Promise.all([
      container.resolve<IExpenseRepository>('IExpenseRepository').findByBudget(id),
      container.resolve<IRevenueRepository>('IRevenueRepository').findByBudget(id),
      container.resolve<ISavingRepository>('ISavingRepository').findByBudget(id),
      container.resolve<IAssetRepository>('IAssetRepository').findByBudget(id),
      container.resolve<IPersonRepository>('IPersonRepository').findByBudget(id),
    ]);

    // Fetch loan payments for each loan expense
    const loanPaymentRepo = container.resolve<ILoanPaymentRepository>('ILoanPaymentRepository');
    const loanExpenses = expenses.filter((e) => e.type === 'LOAN' && e.loanDetail);
    const paymentArrays = await Promise.all(
      loanExpenses.map((e) => loanPaymentRepo.findByLoan(e.loanDetail!.id))
    );
    const loanPayments = paymentArrays.flat();

    const service = new ProjectionService();
    const result = service.compute({
      startDate,
      endDate,
      initialSaving: budget.initialSaving,
      expenses,
      revenues,
      savings,
      assets,
      persons,
      loanPayments,
    });

    const points = granularity === 'yearly' ? service.aggregate(result.points) : result.points;

    return c.json(
      {
        points: points.map((p) => ({ ...p, date: p.date.toISOString() })),
        persons: result.persons.map((p) => ({
          ...p,
          ageByYear: Object.fromEntries(Object.entries(p.ageByYear).map(([k, v]) => [k, v])),
        })),
      },
      200
    );
  });

  return app;
}
