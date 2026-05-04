import { injectable, inject } from 'tsyringe';
import type { BudgetInvite } from '../entities/BudgetInvite.js';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import type { IBudgetInviteRepository } from '../repositories/IBudgetInviteRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListInvitesUseCase {
  constructor(
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository,
    @inject('IBudgetInviteRepository') private inviteRepo: IBudgetInviteRepository
  ) {}

  async execute(budgetId: string, requesterId: string): Promise<BudgetInvite[]> {
    const requester = await this.memberRepo.findByBudgetAndUser(budgetId, requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new ForbiddenError('Only OWNER can list invites');

    return this.inviteRepo.findByBudget(budgetId);
  }
}
