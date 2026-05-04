import { randomBytes } from 'crypto';
import { injectable, inject } from 'tsyringe';
import type { BudgetInvite, InviteRole } from '../entities/BudgetInvite.js';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import type { IBudgetInviteRepository } from '../repositories/IBudgetInviteRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

export interface CreateInviteInput {
  budgetId: string;
  requesterId: string;
  role: InviteRole;
  expiresAt?: string;
  maxUses?: number;
}

@injectable()
export class CreateInviteUseCase {
  constructor(
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository,
    @inject('IBudgetInviteRepository') private inviteRepo: IBudgetInviteRepository
  ) {}

  async execute(input: CreateInviteInput): Promise<BudgetInvite> {
    const requester = await this.memberRepo.findByBudgetAndUser(input.budgetId, input.requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new ForbiddenError('Only OWNER can create invite links');

    const token = randomBytes(16).toString('base64url');

    return this.inviteRepo.create({
      budgetId: input.budgetId,
      token,
      role: input.role,
      createdBy: input.requesterId,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      maxUses: input.maxUses,
    });
  }
}
