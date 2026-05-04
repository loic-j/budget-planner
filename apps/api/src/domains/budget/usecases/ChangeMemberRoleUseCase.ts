import { injectable, inject } from 'tsyringe';
import type { BudgetMember } from '../entities/BudgetMember.js';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import type { InviteRole } from '../entities/BudgetInvite.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ChangeMemberRoleUseCase {
  constructor(@inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository) {}

  async execute(
    budgetId: string,
    requesterId: string,
    targetUserId: string,
    role: InviteRole
  ): Promise<BudgetMember> {
    if (requesterId === targetUserId) {
      throw new ValidationError('Cannot change your own role');
    }

    const requester = await this.memberRepo.findByBudgetAndUser(budgetId, requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new ForbiddenError('Only OWNER can change member roles');

    const target = await this.memberRepo.findByBudgetAndUser(budgetId, targetUserId);
    if (!target) throw new NotFoundError(`User ${targetUserId} is not a member of this budget`);

    return this.memberRepo.updateRole(budgetId, targetUserId, role);
  }
}
