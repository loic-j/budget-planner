import { injectable, inject } from 'tsyringe';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import type { IBudgetInviteRepository } from '../repositories/IBudgetInviteRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class RevokeInviteUseCase {
  constructor(
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository,
    @inject('IBudgetInviteRepository') private inviteRepo: IBudgetInviteRepository
  ) {}

  async execute(budgetId: string, requesterId: string, inviteId: string): Promise<void> {
    const requester = await this.memberRepo.findByBudgetAndUser(budgetId, requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new ForbiddenError('Only OWNER can revoke invites');

    const invites = await this.inviteRepo.findByBudget(budgetId);
    const invite = invites.find((i) => i.id === inviteId);
    if (!invite) throw new NotFoundError(`Invite ${inviteId} not found`);

    await this.inviteRepo.delete(inviteId);
  }
}
