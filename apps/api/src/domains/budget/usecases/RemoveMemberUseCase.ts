import { injectable, inject } from 'tsyringe';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class RemoveMemberUseCase {
  constructor(@inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository) {}

  async execute(budgetId: string, requesterId: string, targetUserId: string): Promise<void> {
    if (requesterId === targetUserId) {
      throw new ValidationError('Cannot remove yourself — use leave instead');
    }

    const requester = await this.memberRepo.findByBudgetAndUser(budgetId, requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new ForbiddenError('Only OWNER can remove members');

    const target = await this.memberRepo.findByBudgetAndUser(budgetId, targetUserId);
    if (!target) throw new NotFoundError(`User ${targetUserId} is not a member of this budget`);

    await this.memberRepo.delete(budgetId, targetUserId);
  }
}
