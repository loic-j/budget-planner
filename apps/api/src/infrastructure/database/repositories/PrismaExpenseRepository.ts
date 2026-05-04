import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Expense as PrismaExpense, LoanDetail as PrismaLoanDetail } from '@prisma/client';
import { Expense } from '../../../domains/expenses/entities/Expense.js';
import { LoanDetail } from '../../../domains/expenses/entities/LoanDetail.js';
import type {
  IExpenseRepository,
  CreateExpenseData,
  UpdateRegularExpenseData,
  UpdateLoanExpenseData,
} from '../../../domains/expenses/repositories/IExpenseRepository.js';
import type { ExpenseType, Frequency } from '../../../domains/expenses/entities/Expense.js';
import type { LoanType } from '../../../domains/expenses/entities/LoanDetail.js';
import { NotFoundError } from '../../errors/DomainError.js';

type PrismaExpenseWithLoan = PrismaExpense & { loanDetail: PrismaLoanDetail | null };

@injectable()
export class PrismaExpenseRepository implements IExpenseRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Expense | null> {
    const row = await this.prisma.expense.findUnique({
      where: { id },
      include: { loanDetail: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string): Promise<Expense[]> {
    const rows = await this.prisma.expense.findMany({
      where: { budgetId },
      include: { loanDetail: true },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(budgetId: string, data: CreateExpenseData): Promise<Expense> {
    const row = await this.prisma.expense.create({
      data: {
        budgetId,
        type: data.type,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        categoryId: data.type === 'REGULAR' ? data.categoryId : undefined,
        personId: data.personId,
        frequency_value: data.type === 'REGULAR' ? data.frequencyValue : undefined,
        start_date: data.startDate,
        end_date: data.type === 'REGULAR' ? data.endDate : undefined,
      },
      include: { loanDetail: true },
    });
    return this.toDomain(row);
  }

  async updateRegular(id: string, data: UpdateRegularExpenseData): Promise<Expense> {
    try {
      const row = await this.prisma.expense.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.personId !== undefined && { personId: data.personId }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.frequency !== undefined && { frequency: data.frequency }),
          ...(data.frequencyValue !== undefined && { frequency_value: data.frequencyValue }),
          ...(data.startDate !== undefined && { start_date: data.startDate }),
          ...(data.endDate !== undefined && { end_date: data.endDate }),
        },
        include: { loanDetail: true },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Expense ${id} not found`);
    }
  }

  async updateLoan(id: string, data: UpdateLoanExpenseData): Promise<Expense> {
    try {
      const row = await this.prisma.expense.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.personId !== undefined && { personId: data.personId }),
          ...(data.startDate !== undefined && { start_date: data.startDate }),
          ...(data.endDate !== undefined && { end_date: data.endDate }),
        },
        include: { loanDetail: true },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Expense ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id } });
  }

  private toDomain(row: PrismaExpenseWithLoan): Expense {
    return new Expense(
      row.id,
      row.budgetId,
      row.type as ExpenseType,
      row.name,
      Number(row.amount),
      row.frequency as Frequency,
      row.created_at,
      row.updated_at,
      row.categoryId,
      row.personId,
      row.frequency_value,
      row.start_date,
      row.end_date,
      row.loanDetail ? this.loanDetailToDomain(row.loanDetail) : null
    );
  }

  private loanDetailToDomain(row: PrismaLoanDetail): LoanDetail {
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
