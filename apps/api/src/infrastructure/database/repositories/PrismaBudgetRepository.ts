import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Budget as PrismaBudget, BudgetMember as PrismaMember } from '@prisma/client';
import { Budget, type BudgetMembership } from '../../../domains/budget/entities/Budget.js';
import type {
  IBudgetRepository,
  CreateBudgetData,
  UpdateBudgetData,
} from '../../../domains/budget/repositories/IBudgetRepository.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Budget | null> {
    const row = await this.prisma.budget.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByMember(userId: string): Promise<Budget[]> {
    const rows = await this.prisma.budget.findMany({
      where: { members: { some: { userId } } },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findMember(budgetId: string, userId: string): Promise<BudgetMembership | null> {
    const row = await this.prisma.budgetMember.findUnique({
      where: { budgetId_userId: { budgetId, userId } },
    });
    if (!row) return null;
    return this.toMembership(row);
  }

  async create(data: CreateBudgetData): Promise<Budget> {
    const row = await this.prisma.budget.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        start_date: data.startDate,
        end_date: data.endDate,
        currency: data.currency,
        initial_saving: data.initialSaving,
        members: {
          create: { userId: data.ownerId, role: 'OWNER' },
        },
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateBudgetData): Promise<Budget> {
    try {
      const row = await this.prisma.budget.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.startDate !== undefined && { start_date: data.startDate }),
          ...(data.endDate !== undefined && { end_date: data.endDate }),
          ...(data.currency !== undefined && { currency: data.currency }),
          ...(data.initialSaving !== undefined && { initial_saving: data.initialSaving }),
        },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Budget ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.budget.delete({ where: { id } });
  }

  private toDomain(row: PrismaBudget): Budget {
    return new Budget(
      row.id,
      row.name,
      row.ownerId,
      row.start_date,
      row.end_date,
      row.currency,
      Number(row.initial_saving),
      row.created_at,
      row.updated_at,
      row.description ?? undefined
    );
  }

  private toMembership(row: PrismaMember): BudgetMembership {
    return {
      budgetId: row.budgetId,
      userId: row.userId,
      role: row.role as BudgetMembership['role'],
    };
  }
}
