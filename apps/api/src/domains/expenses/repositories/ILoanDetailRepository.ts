import type { LoanDetail, LoanType } from '../entities/LoanDetail.js';

export interface CreateLoanDetailData {
  expenseId: string;
  loanType: LoanType;
  totalAmount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  loanStartDate: Date;
}

export interface UpdateLoanDetailData {
  loanType?: LoanType;
  totalAmount?: number;
  interestRate?: number;
  durationMonths?: number;
  monthlyPayment?: number;
  loanStartDate?: Date;
}

export interface ILoanDetailRepository {
  findByExpense(expenseId: string): Promise<LoanDetail | null>;
  create(data: CreateLoanDetailData): Promise<LoanDetail>;
  update(id: string, data: UpdateLoanDetailData): Promise<LoanDetail>;
  delete(id: string): Promise<void>;
}
