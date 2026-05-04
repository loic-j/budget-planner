import { z } from '@hono/zod-openapi';

const frequencyEnum = z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY', 'EVERY_X_MONTHS', 'EVERY_X_YEARS']);
const loanTypeEnum = z.enum(['MORTGAGE', 'CAR_LOAN', 'PERSONAL', 'STUDENT', 'OTHER']);

export const createRegularExpenseSchema = z.object({
  type: z.literal('REGULAR'),
  name: z.string().min(1),
  categoryId: z.string().optional(),
  personId: z.string().optional(),
  amount: z.number().positive(),
  frequency: frequencyEnum,
  frequencyValue: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createLoanExpenseSchema = z.object({
  type: z.literal('LOAN'),
  name: z.string().min(1),
  personId: z.string().optional(),
  loanType: loanTypeEnum,
  totalAmount: z.number().positive(),
  interestRate: z.number().min(0).max(100),
  durationMonths: z.number().int().positive(),
  loanStartDate: z.string().datetime(),
});

export const createExpenseSchema = z.discriminatedUnion('type', [
  createRegularExpenseSchema,
  createLoanExpenseSchema,
]);

export const updateRegularExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  amount: z.number().positive().optional(),
  frequency: frequencyEnum.optional(),
  frequencyValue: z.number().int().positive().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const updateLoanExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  personId: z.string().nullable().optional(),
  loanType: loanTypeEnum.optional(),
  totalAmount: z.number().positive().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  durationMonths: z.number().int().positive().optional(),
  loanStartDate: z.string().datetime().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

const loanDetailResponseSchema = z.object({
  id: z.string(),
  loanType: loanTypeEnum,
  totalAmount: z.number(),
  interestRate: z.number(),
  durationMonths: z.number(),
  monthlyPayment: z.number(),
  loanStartDate: z.string(),
});

export const expenseResponseSchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  type: z.enum(['REGULAR', 'LOAN']),
  name: z.string(),
  categoryId: z.string().nullable(),
  personId: z.string().nullable(),
  amount: z.number(),
  frequency: frequencyEnum,
  frequencyValue: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  loanDetail: loanDetailResponseSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseListResponseSchema = z.array(expenseResponseSchema);

export const loanPaymentResponseSchema = z.object({
  id: z.string(),
  loanDetailId: z.string(),
  paymentNumber: z.number(),
  paymentDate: z.string(),
  amount: z.number(),
  principalAmount: z.number(),
  interestAmount: z.number(),
  remainingBalance: z.number(),
});

export const loanScheduleResponseSchema = z.array(loanPaymentResponseSchema);
