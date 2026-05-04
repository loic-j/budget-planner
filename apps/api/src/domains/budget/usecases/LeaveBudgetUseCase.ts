import { injectable, inject } from 'tsyringe';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import { NotFoundError, ValidationError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class LeaveBudgetUseCase {
  constructor(@inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository) {}

  async execute(budgetId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new NotFoundError('Not a member of this budget');
    if (member.role === 'OWNER')
      throw new ValidationError('Owner cannot leave the budget — transfer ownership first');

    await this.memberRepo.delete(budgetId, userId);
  }
}
