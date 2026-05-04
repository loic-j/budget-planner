import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { LoanPayment as PrismaLoanPayment } from '@prisma/client';
import { LoanPayment } from '../../../domains/expenses/entities/LoanPayment.js';
import type { ILoanPaymentRepository } from '../../../domains/expenses/repositories/ILoanPaymentRepository.js';
import type { LoanPaymentData } from '../../../domains/expenses/services/LoanCalculationService.js';

@injectable()
export class PrismaLoanPaymentRepository implements ILoanPaymentRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findByLoan(loanDetailId: string): Promise<LoanPayment[]> {
    const rows = await this.prisma.loanPayment.findMany({
      where: { loanDetailId },
      orderBy: { payment_number: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async bulkCreate(loanDetailId: string, payments: LoanPaymentData[]): Promise<void> {
    await this.prisma.loanPayment.createMany({
      data: payments.map((p) => ({
        loanDetailId,
        payment_number: p.paymentNumber,
        payment_date: p.paymentDate,
        amount: p.amount,
        principal_amount: p.principalAmount,
        interest_amount: p.interestAmount,
        remaining_balance: p.remainingBalance,
      })),
    });
  }

  async deleteByLoan(loanDetailId: string): Promise<void> {
    await this.prisma.loanPayment.deleteMany({ where: { loanDetailId } });
  }

  private toDomain(row: PrismaLoanPayment): LoanPayment {
    return new LoanPayment(
      row.id,
      row.loanDetailId,
      row.payment_number,
      row.payment_date,
      Number(row.amount),
      Number(row.principal_amount),
      Number(row.interest_amount),
      Number(row.remaining_balance),
      row.created_at
    );
  }
}
