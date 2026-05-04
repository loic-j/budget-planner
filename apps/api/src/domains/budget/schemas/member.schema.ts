import { z } from '@hono/zod-openapi';

export const memberResponseSchema = z
  .object({
    id: z.string(),
    budgetId: z.string(),
    userId: z.string(),
    role: z.enum(['OWNER', 'EDITOR', 'VIEWER']),
    joinedAt: z.string(),
    userEmail: z.string(),
    userName: z.string().nullable(),
  })
  .openapi('MemberResponse');

export const memberListResponseSchema = z.array(memberResponseSchema).openapi('MemberListResponse');

export const changeMemberRoleSchema = z
  .object({
    role: z.enum(['EDITOR', 'VIEWER']),
  })
  .openapi('ChangeMemberRole');

export const inviteResponseSchema = z
  .object({
    id: z.string(),
    budgetId: z.string(),
    token: z.string(),
    role: z.enum(['EDITOR', 'VIEWER']),
    createdBy: z.string(),
    createdAt: z.string(),
    expiresAt: z.string().nullable(),
    maxUses: z.number().nullable(),
    useCount: z.number(),
    isExpired: z.boolean(),
    isMaxUsesReached: z.boolean(),
  })
  .openapi('InviteResponse');

export const inviteListResponseSchema = z.array(inviteResponseSchema).openapi('InviteListResponse');

export const createInviteSchema = z
  .object({
    role: z.enum(['EDITOR', 'VIEWER']),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().positive().optional(),
  })
  .openapi('CreateInvite');

export const invitePreviewSchema = z
  .object({
    budgetName: z.string(),
    role: z.enum(['EDITOR', 'VIEWER']),
    isValid: z.boolean(),
  })
  .openapi('InvitePreview');
