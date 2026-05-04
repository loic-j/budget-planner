import type { LoanPayment } from '../entities/LoanPayment.js';
import type { LoanPaymentData } from '../services/LoanCalculationService.js';

export interface ILoanPaymentRepository {
  findByLoan(loanDetailId: string): Promise<LoanPayment[]>;
  bulkCreate(loanDetailId: string, payments: LoanPaymentData[]): Promise<void>;
  deleteByLoan(loanDetailId: string): Promise<void>;
}
