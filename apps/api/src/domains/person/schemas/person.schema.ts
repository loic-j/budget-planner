import { z } from '@hono/zod-openapi';

export const personResponseSchema = z
  .object({
    id: z.string(),
    budgetId: z.string(),
    type: z.enum(['ADULT', 'CHILD']),
    name: z.string(),
    sex: z.enum(['MALE', 'FEMALE', 'OTHER']),
    dob: z.string().nullable(),
    plannedDob: z.string().nullable(),
    age: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('PersonResponse');

export const personListResponseSchema = z.array(personResponseSchema).openapi('PersonListResponse');

export const createPersonSchema = z
  .object({
    type: z.enum(['ADULT', 'CHILD']),
    name: z.string().min(1, 'Name is required'),
    sex: z.enum(['MALE', 'FEMALE', 'OTHER']),
    dob: z.string().datetime().optional(),
    plannedDob: z.string().datetime().optional(),
  })
  .refine(
    (d) => {
      if (d.type === 'ADULT') return !!d.dob;
      return !!(d.dob || d.plannedDob);
    },
    { message: 'ADULT requires dob; CHILD requires dob or plannedDob', path: ['dob'] }
  )
  .refine((d) => !(d.dob && d.plannedDob), {
    message: 'Cannot set both dob and plannedDob',
    path: ['plannedDob'],
  })
  .openapi('CreatePerson');

export const updatePersonSchema = z
  .object({
    name: z.string().min(1).optional(),
    sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dob: z.string().datetime().nullable().optional(),
    plannedDob: z.string().datetime().nullable().optional(),
  })
  .openapi('UpdatePerson');
