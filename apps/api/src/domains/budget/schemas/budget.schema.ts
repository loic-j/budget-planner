import { z } from '@hono/zod-openapi';

export const createBudgetSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    startDate: z.string().datetime({ message: 'startDate must be an ISO 8601 date-time string' }),
    endDate: z.string().datetime({ message: 'endDate must be an ISO 8601 date-time string' }),
    currency: z.string().length(3).default('EUR'),
    initialSaving: z.number().min(0).default(0),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  currency: z.string().length(3).optional(),
  initialSaving: z.number().min(0).optional(),
});

export const budgetResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ownerId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  currency: z.string(),
  initialSaving: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const budgetListResponseSchema = z.array(budgetResponseSchema);

export type BudgetResponse = z.infer<typeof budgetResponseSchema>;
