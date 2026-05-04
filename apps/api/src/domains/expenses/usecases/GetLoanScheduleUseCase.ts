import { injectable, inject } from 'tsyringe';
import type { LoanPayment } from '../entities/LoanPayment.js';
import type { IExpenseRepository } from '../repositories/IExpenseRepository.js';
import type { ILoanDetailRepository } from '../repositories/ILoanDetailRepository.js';
import type { ILoanPaymentRepository } from '../repositories/ILoanPaymentRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class GetLoanScheduleUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('ILoanDetailRepository') private loanDetailRepo: ILoanDetailRepository,
    @inject('ILoanPaymentRepository') private loanPaymentRepo: ILoanPaymentRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, expenseId: string, userId: string): Promise<LoanPayment[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense || expense.budgetId !== budgetId)
      throw new NotFoundError(`Expense ${expenseId} not found`);
    const loanDetail = await this.loanDetailRepo.findByExpense(expenseId);
    if (!loanDetail) throw new NotFoundError(`Expense ${expenseId} is not a loan`);
    return this.loanPaymentRepo.findByLoan(loanDetail.id);
  }
}
