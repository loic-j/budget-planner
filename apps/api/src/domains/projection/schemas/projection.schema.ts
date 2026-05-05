import { z } from '@hono/zod-openapi';

export const projectionPointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  expense: z.number(),
  savingContribution: z.number(),
  assetValue: z.number(),
  loanBalance: z.number(),
  cashBalance: z.number(),
  savingsBalance: z.number(),
  netWorth: z.number(),
});

export const personAgePointSchema = z.object({
  personId: z.string(),
  name: z.string(),
  type: z.enum(['ADULT', 'CHILD']),
  ageByYear: z.record(z.string(), z.number().nullable()),
});

export const projectionResponseSchema = z.object({
  points: z.array(projectionPointSchema),
  persons: z.array(personAgePointSchema),
});
