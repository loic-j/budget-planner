import { injectable, inject } from 'tsyringe';
import type { Expense } from '../entities/Expense.js';
import type {
  IExpenseRepository,
  CreateRegularExpenseData,
} from '../repositories/IExpenseRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class CreateRegularExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    userId: string,
    data: Omit<CreateRegularExpenseData, 'type'>
  ): Promise<Expense> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage expenses');
    return this.expenseRepo.create(budgetId, { ...data, type: 'REGULAR' });
  }
}
