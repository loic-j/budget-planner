import { injectable, inject } from 'tsyringe';
import type { Expense } from '../entities/Expense.js';
import type { IExpenseRepository } from '../repositories/IExpenseRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class GetExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, expenseId: string, userId: string): Promise<Expense> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense || expense.budgetId !== budgetId)
      throw new NotFoundError(`Expense ${expenseId} not found`);
    return expense;
  }
}
