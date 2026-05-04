import { injectable, inject } from 'tsyringe';
import type { Expense } from '../entities/Expense.js';
import type { IExpenseRepository } from '../repositories/IExpenseRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListExpensesUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string): Promise<Expense[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    return this.expenseRepo.findByBudget(budgetId);
  }
}
