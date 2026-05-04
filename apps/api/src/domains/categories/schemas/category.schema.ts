import { z } from '@hono/zod-openapi';

export const categoryResponseSchema = z
  .object({
    id: z.string(),
    budgetId: z.string(),
    type: z.enum(['EXPENSE', 'REVENUE', 'SAVING']),
    name: z.string(),
    icon: z.string(),
    isPreset: z.boolean(),
    createdAt: z.string(),
  })
  .openapi('CategoryResponse');

export const categoryListResponseSchema = z
  .array(categoryResponseSchema)
  .openapi('CategoryListResponse');

export const createCategorySchema = z
  .object({
    type: z.enum(['EXPENSE', 'REVENUE', 'SAVING']),
    name: z.string().min(1, 'Name is required'),
    icon: z.string().min(1, 'Icon is required'),
  })
  .openapi('CreateCategory');

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
  })
  .openapi('UpdateCategory');
