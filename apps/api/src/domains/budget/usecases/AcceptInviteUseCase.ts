import { injectable, inject } from 'tsyringe';
import type { BudgetMember } from '../entities/BudgetMember.js';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import type { IBudgetInviteRepository } from '../repositories/IBudgetInviteRepository.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class AcceptInviteUseCase {
  constructor(
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository,
    @inject('IBudgetInviteRepository') private inviteRepo: IBudgetInviteRepository
  ) {}

  async execute(token: string, userId: string): Promise<BudgetMember> {
    const invite = await this.inviteRepo.findByToken(token);
    if (!invite) throw new NotFoundError('Invite not found or already used');

    if (invite.isExpired) throw new ValidationError('Invite link has expired');
    if (invite.isMaxUsesReached)
      throw new ValidationError('Invite link has reached its maximum uses');

    const existing = await this.memberRepo.findByBudgetAndUser(invite.budgetId, userId);
    if (existing) throw new ConflictError('You are already a member of this budget');

    const member = await this.memberRepo.create(invite.budgetId, userId, invite.role);
    await this.inviteRepo.incrementUseCount(invite.id);

    return member;
  }
}
