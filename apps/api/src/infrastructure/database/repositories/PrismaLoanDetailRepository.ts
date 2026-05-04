import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { LoanDetail as PrismaLoanDetail } from '@prisma/client';
import { LoanDetail } from '../../../domains/expenses/entities/LoanDetail.js';
import type {
  ILoanDetailRepository,
  CreateLoanDetailData,
  UpdateLoanDetailData,
} from '../../../domains/expenses/repositories/ILoanDetailRepository.js';
import type { LoanType } from '../../../domains/expenses/entities/LoanDetail.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaLoanDetailRepository implements ILoanDetailRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findByExpense(expenseId: string): Promise<LoanDetail | null> {
    const row = await this.prisma.loanDetail.findUnique({ where: { expenseId } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateLoanDetailData): Promise<LoanDetail> {
    const row = await this.prisma.loanDetail.create({
      data: {
        expenseId: data.expenseId,
        loan_type: data.loanType,
        total_amount: data.totalAmount,
        interest_rate: data.interestRate,
        duration_months: data.durationMonths,
        monthly_payment: data.monthlyPayment,
        loan_start_date: data.loanStartDate,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateLoanDetailData): Promise<LoanDetail> {
    try {
      const row = await this.prisma.loanDetail.update({
        where: { id },
        data: {
          ...(data.loanType !== undefined && { loan_type: data.loanType }),
          ...(data.totalAmount !== undefined && { total_amount: data.totalAmount }),
          ...(data.interestRate !== undefined && { interest_rate: data.interestRate }),
          ...(data.durationMonths !== undefined && { duration_months: data.durationMonths }),
          ...(data.monthlyPayment !== undefined && { monthly_payment: data.monthlyPayment }),
          ...(data.loanStartDate !== undefined && { loan_start_date: data.loanStartDate }),
        },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`LoanDetail ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loanDetail.delete({ where: { id } });
  }

  private toDomain(row: PrismaLoanDetail): LoanDetail {
    return new LoanDetail(
      row.id,
      row.expenseId,
      row.loan_type as LoanType,
      Number(row.total_amount),
      Number(row.interest_rate),
      row.duration_months,
      Number(row.monthly_payment),
      row.loan_start_date
    );
  }
}
