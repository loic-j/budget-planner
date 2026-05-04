import { z } from '@hono/zod-openapi';

const assetTypeEnum = z.enum(['REAL_ESTATE', 'INVESTMENT', 'VEHICLE', 'OTHER']);

export const createAssetSchema = z.object({
  type: assetTypeEnum,
  name: z.string().min(1),
  currentValue: z.number().positive(),
  acquisitionDate: z.string().datetime(),
  annualGrowthRate: z.number(),
  loanDetailId: z.string().optional(),
});

export const updateAssetSchema = z.object({
  type: assetTypeEnum.optional(),
  name: z.string().min(1).optional(),
  currentValue: z.number().positive().optional(),
  acquisitionDate: z.string().datetime().optional(),
  annualGrowthRate: z.number().optional(),
  loanDetailId: z.string().nullable().optional(),
});

export const assetResponseSchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  type: assetTypeEnum,
  name: z.string(),
  currentValue: z.number(),
  acquisitionDate: z.string(),
  annualGrowthRate: z.number(),
  loanDetailId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const assetListResponseSchema = z.array(assetResponseSchema);
