import { z } from '@hono/zod-openapi';

const frequencyEnum = z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY', 'EVERY_X_MONTHS', 'EVERY_X_YEARS']);

export const createRevenueSchema = z
  .object({
    name: z.string().min(1),
    categoryId: z.string().optional(),
    personId: z.string().optional(),
    amount: z.number().positive(),
    frequency: frequencyEnum,
    frequencyValue: z.number().int().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (v) =>
      (v.frequency === 'EVERY_X_MONTHS' || v.frequency === 'EVERY_X_YEARS') ===
      (v.frequencyValue !== undefined),
    {
      message: 'frequencyValue required for EVERY_X_MONTHS / EVERY_X_YEARS',
      path: ['frequencyValue'],
    }
  );

export const updateRevenueSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  amount: z.number().positive().optional(),
  frequency: frequencyEnum.optional(),
  frequencyValue: z.number().int().positive().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const revenueResponseSchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  name: z.string(),
  categoryId: z.string().nullable(),
  personId: z.string().nullable(),
  amount: z.number(),
  frequency: frequencyEnum,
  frequencyValue: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const revenueListResponseSchema = z.array(revenueResponseSchema);
