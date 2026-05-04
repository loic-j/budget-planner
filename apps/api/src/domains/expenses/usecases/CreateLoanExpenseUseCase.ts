import { injectable, inject } from 'tsyringe';
import type { Expense } from '../entities/Expense.js';
import type { IExpenseRepository } from '../repositories/IExpenseRepository.js';
import type {
  ILoanDetailRepository,
  CreateLoanDetailData,
} from '../repositories/ILoanDetailRepository.js';
import type { ILoanPaymentRepository } from '../repositories/ILoanPaymentRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import type { LoanType } from '../entities/LoanDetail.js';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
} from '../services/LoanCalculationService.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

export interface CreateLoanInput {
  name: string;
  personId?: string;
  loanType: LoanType;
  totalAmount: number;
  interestRate: number;
  durationMonths: number;
  loanStartDate: Date;
}

@injectable()
export class CreateLoanExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepo: IExpenseRepository,
    @inject('ILoanDetailRepository') private loanDetailRepo: ILoanDetailRepository,
    @inject('ILoanPaymentRepository') private loanPaymentRepo: ILoanPaymentRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, data: CreateLoanInput): Promise<Expense> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage expenses');

    const monthlyPayment = calculateMonthlyPayment(
      data.totalAmount,
      data.interestRate,
      data.durationMonths
    );

    const expense = await this.expenseRepo.create(budgetId, {
      type: 'LOAN',
      name: data.name,
      personId: data.personId,
      amount: monthlyPayment,
      frequency: 'MONTHLY',
      startDate: data.loanStartDate,
    });

    const loanDetailData: CreateLoanDetailData = {
      expenseId: expense.id,
      loanType: data.loanType,
      totalAmount: data.totalAmount,
      interestRate: data.interestRate,
      durationMonths: data.durationMonths,
      monthlyPayment,
      loanStartDate: data.loanStartDate,
    };

    const loanDetail = await this.loanDetailRepo.create(loanDetailData);
    const schedule = generateAmortizationSchedule(loanDetail);
    await this.loanPaymentRepo.bulkCreate(loanDetail.id, schedule);

    // Return expense with loanDetail attached (repo re-fetches with join)
    const full = await this.expenseRepo.findById(expense.id);
    return full!;
  }
}
