import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListExpensesUseCase } from '../../domains/expenses/usecases/ListExpensesUseCase.js';
import { GetExpenseUseCase } from '../../domains/expenses/usecases/GetExpenseUseCase.js';
import { CreateRegularExpenseUseCase } from '../../domains/expenses/usecases/CreateRegularExpenseUseCase.js';
import { CreateLoanExpenseUseCase } from '../../domains/expenses/usecases/CreateLoanExpenseUseCase.js';
import { UpdateRegularExpenseUseCase } from '../../domains/expenses/usecases/UpdateRegularExpenseUseCase.js';
import { UpdateLoanExpenseUseCase } from '../../domains/expenses/usecases/UpdateLoanExpenseUseCase.js';
import { DeleteExpenseUseCase } from '../../domains/expenses/usecases/DeleteExpenseUseCase.js';
import { GetLoanScheduleUseCase } from '../../domains/expenses/usecases/GetLoanScheduleUseCase.js';
import {
  createExpenseSchema,
  updateRegularExpenseSchema,
  updateLoanExpenseSchema,
  expenseResponseSchema,
  expenseListResponseSchema,
  loanScheduleResponseSchema,
} from '../../domains/expenses/schemas/expense.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Expense } from '../../domains/expenses/entities/Expense.js';
import type { LoanPayment } from '../../domains/expenses/entities/LoanPayment.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const budgetIdParam = z.object({ id: z.string() });
const expenseParams = z.object({ id: z.string(), eid: z.string() });

function toExpenseResponse(e: Expense) {
  return {
    id: e.id,
    budgetId: e.budgetId,
    type: e.type,
    name: e.name,
    categoryId: e.categoryId,
    personId: e.personId,
    amount: e.amount,
    frequency: e.frequency,
    frequencyValue: e.frequencyValue,
    startDate: e.startDate ? e.startDate.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    loanDetail: e.loanDetail
      ? {
          id: e.loanDetail.id,
          loanType: e.loanDetail.loanType,
          totalAmount: e.loanDetail.totalAmount,
          interestRate: e.loanDetail.interestRate,
          durationMonths: e.loanDetail.durationMonths,
          monthlyPayment: e.loanDetail.monthlyPayment,
          loanStartDate: e.loanDetail.loanStartDate.toISOString(),
        }
      : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function toLoanPaymentResponse(p: LoanPayment) {
  return {
    id: p.id,
    loanDetailId: p.loanDetailId,
    paymentNumber: p.paymentNumber,
    paymentDate: p.paymentDate.toISOString(),
    amount: p.amount,
    principalAmount: p.principalAmount,
    interestAmount: p.interestAmount,
    remainingBalance: p.remainingBalance,
  };
}

const listRoute = createRoute({
  method: 'get',
  path: '/{id}/expenses',
  tags: ['Expenses'],
  summary: 'List expenses in a budget',
  request: { params: budgetIdParam },
  responses: {
    200: {
      content: { 'application/json': { schema: expenseListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const getRoute = createRoute({
  method: 'get',
  path: '/{id}/expenses/{eid}',
  tags: ['Expenses'],
  summary: 'Get a single expense',
  request: { params: expenseParams },
  responses: {
    200: {
      content: { 'application/json': { schema: expenseResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/{id}/expenses',
  tags: ['Expenses'],
  summary: 'Create an expense (REGULAR or LOAN)',
  request: {
    params: budgetIdParam,
    body: { content: { 'application/json': { schema: createExpenseSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: expenseResponseSchema } },
      description: 'Created',
    },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const updateRegularRoute = createRoute({
  method: 'patch',
  path: '/{id}/expenses/{eid}/regular',
  tags: ['Expenses'],
  summary: 'Update a REGULAR expense',
  request: {
    params: expenseParams,
    body: { content: { 'application/json': { schema: updateRegularExpenseSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: expenseResponseSchema } }, description: 'OK' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const updateLoanRoute = createRoute({
  method: 'patch',
  path: '/{id}/expenses/{eid}/loan',
  tags: ['Expenses'],
  summary: 'Update a LOAN expense',
  request: {
    params: expenseParams,
    body: { content: { 'application/json': { schema: updateLoanExpenseSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: expenseResponseSchema } }, description: 'OK' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}/expenses/{eid}',
  tags: ['Expenses'],
  summary: 'Delete an expense',
  request: { params: expenseParams },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const loanScheduleRoute = createRoute({
  method: 'get',
  path: '/{id}/expenses/{eid}/loan-schedule',
  tags: ['Expenses'],
  summary: 'Get full amortization schedule for a loan expense',
  request: { params: expenseParams },
  responses: {
    200: {
      content: { 'application/json': { schema: loanScheduleResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createExpenseController(authMiddleware: MiddlewareHandler<AppEnv>) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(ListExpensesUseCase);
    const expenses = await useCase.execute(id, user.id);
    return c.json(expenses.map(toExpenseResponse), 200);
  });

  app.openapi(getRoute, async (c) => {
    const user = c.get('user');
    const { id, eid } = c.req.valid('param');
    const useCase = container.resolve(GetExpenseUseCase);
    const expense = await useCase.execute(id, eid, user.id);
    return c.json(toExpenseResponse(expense), 200);
  });

  app.openapi(createRoute_, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    let expense: Expense;
    if (body.type === 'REGULAR') {
      const useCase = container.resolve(CreateRegularExpenseUseCase);
      expense = await useCase.execute(id, user.id, {
        name: body.name,
        categoryId: body.categoryId,
        personId: body.personId,
        amount: body.amount,
        frequency: body.frequency,
        frequencyValue: body.frequencyValue,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      });
    } else {
      const useCase = container.resolve(CreateLoanExpenseUseCase);
      expense = await useCase.execute(id, user.id, {
        name: body.name,
        personId: body.personId,
        loanType: body.loanType,
        totalAmount: body.totalAmount,
        interestRate: body.interestRate,
        durationMonths: body.durationMonths,
        loanStartDate: new Date(body.loanStartDate),
      });
    }
    return c.json(toExpenseResponse(expense), 201);
  });

  app.openapi(updateRegularRoute, async (c) => {
    const user = c.get('user');
    const { id, eid } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(UpdateRegularExpenseUseCase);
    const expense = await useCase.execute(id, eid, user.id, {
      name: body.name,
      categoryId: body.categoryId === undefined ? undefined : body.categoryId,
      personId: body.personId === undefined ? undefined : body.personId,
      amount: body.amount,
      frequency: body.frequency,
      frequencyValue: body.frequencyValue === undefined ? undefined : body.frequencyValue,
      startDate:
        body.startDate === undefined
          ? undefined
          : body.startDate === null
            ? null
            : new Date(body.startDate),
      endDate:
        body.endDate === undefined
          ? undefined
          : body.endDate === null
            ? null
            : new Date(body.endDate),
    });
    return c.json(toExpenseResponse(expense), 200);
  });

  app.openapi(updateLoanRoute, async (c) => {
    const user = c.get('user');
    const { id, eid } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(UpdateLoanExpenseUseCase);
    const expense = await useCase.execute(id, eid, user.id, {
      name: body.name,
      personId: body.personId === undefined ? undefined : body.personId,
      loanType: body.loanType,
      totalAmount: body.totalAmount,
      interestRate: body.interestRate,
      durationMonths: body.durationMonths,
      loanStartDate: body.loanStartDate ? new Date(body.loanStartDate) : undefined,
      startDate:
        body.startDate === undefined
          ? undefined
          : body.startDate === null
            ? null
            : new Date(body.startDate),
      endDate:
        body.endDate === undefined
          ? undefined
          : body.endDate === null
            ? null
            : new Date(body.endDate),
    });
    return c.json(toExpenseResponse(expense), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const user = c.get('user');
    const { id, eid } = c.req.valid('param');
    const useCase = container.resolve(DeleteExpenseUseCase);
    await useCase.execute(id, eid, user.id);
    return c.body(null, 204);
  });

  app.openapi(loanScheduleRoute, async (c) => {
    const user = c.get('user');
    const { id, eid } = c.req.valid('param');
    const useCase = container.resolve(GetLoanScheduleUseCase);
    const payments = await useCase.execute(id, eid, user.id);
    return c.json(payments.map(toLoanPaymentResponse), 200);
  });

  return app;
}
