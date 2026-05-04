import { injectable, inject } from 'tsyringe';
import type { Expense } from '../entities/Expense.js';
import type { IExpenseRepository } from '../repositories/IExpenseRepository.js';
import type {
  ILoanDetailRepository,
  UpdateLoanDetailData,
} from '../repositories/ILoanDetailRepository.js';
import type { ILoanPaymentRepository } from '../repositories/ILoanPaymentRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import type { LoanType } from '../entities/LoanDetail.js';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
} from '../services/LoanCalculationService.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

export interface UpdateLoanInput {
  name?: string;
  personId?: string | null;
  loanType?: LoanType;
  totalAmount?: number;
  interestRate?: number;
  durationMonths?: number;
  loanStartDate?: Date;
  startDate?: Date | null;
  endDate?: Date | null;
}

@injectable()
export class UpdateLoanExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('ILoanDetailRepository') private loanDetailRepo: ILoanDetailRepository,
    @inject('ILoanPaymentRepository') private loanPaymentRepo: ILoanPaymentRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    expenseId: string,
    userId: string,
    data: UpdateLoanInput
  ): Promise<Expense> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage expenses');

    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense || expense.budgetId !== budgetId)
      throw new NotFoundError(`Expense ${expenseId} not found`);

    const loanDetail = await this.loanDetailRepo.findByExpense(expenseId);
    if (!loanDetail) throw new NotFoundError(`Loan detail for expense ${expenseId} not found`);

    const loanChanged =
      data.totalAmount !== undefined ||
      data.interestRate !== undefined ||
      data.durationMonths !== undefined ||
      data.loanStartDate !== undefined;

    let loanUpdateData: UpdateLoanDetailData = {};

    if (loanChanged) {
      const totalAmount = data.totalAmount ?? loanDetail.totalAmount;
      const interestRate = data.interestRate ?? loanDetail.interestRate;
      const durationMonths = data.durationMonths ?? loanDetail.durationMonths;
      const loanStartDate = data.loanStartDate ?? loanDetail.loanStartDate;

      const monthlyPayment = calculateMonthlyPayment(totalAmount, interestRate, durationMonths);

      loanUpdateData = {
        ...(data.loanType !== undefined && { loanType: data.loanType }),
        totalAmount,
        interestRate,
        durationMonths,
        monthlyPayment,
        loanStartDate,
      };

      await this.loanDetailRepo.update(loanDetail.id, loanUpdateData);

      // Regenerate schedule
      const updatedLoan = await this.loanDetailRepo.findByExpense(expenseId);
      await this.loanPaymentRepo.deleteByLoan(loanDetail.id);
      await this.loanPaymentRepo.bulkCreate(
        loanDetail.id,
        generateAmortizationSchedule(updatedLoan!)
      );

      // Sync monthly_payment on the expense row
      await this.expenseRepo.updateLoan(expenseId, {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.personId !== undefined && { personId: data.personId }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      });
      // Update amount to new monthly payment
      await this.expenseRepo.updateRegular(expenseId, { amount: monthlyPayment });
    } else {
      if (data.loanType !== undefined) {
        await this.loanDetailRepo.update(loanDetail.id, { loanType: data.loanType });
      }
      await this.expenseRepo.updateLoan(expenseId, {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.personId !== undefined && { personId: data.personId }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      });
    }

    const full = await this.expenseRepo.findById(expenseId);
    return full!;
  }
}
