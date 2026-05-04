import { injectable, inject } from 'tsyringe';
import type { Expense } from '../entities/Expense.js';
import type {
  IExpenseRepository,
  UpdateRegularExpenseData,
} from '../repositories/IExpenseRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class UpdateRegularExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    expenseId: string,
    userId: string,
    data: UpdateRegularExpenseData
  ): Promise<Expense> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage expenses');
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense || expense.budgetId !== budgetId)
      throw new NotFoundError(`Expense ${expenseId} not found`);
    return this.expenseRepo.updateRegular(expenseId, data);
  }
}
