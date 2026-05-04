import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Revenue as PrismaRevenue } from '@prisma/client';
import { Revenue } from '../../../domains/revenues/entities/Revenue.js';
import type {
  IRevenueRepository,
  CreateRevenueData,
  UpdateRevenueData,
} from '../../../domains/revenues/repositories/IRevenueRepository.js';
import type { Frequency } from '../../../domains/revenues/entities/Revenue.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaRevenueRepository implements IRevenueRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Revenue | null> {
    const row = await this.prisma.revenue.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string, personId?: string): Promise<Revenue[]> {
    const rows = await this.prisma.revenue.findMany({
      where: { budgetId, ...(personId && { personId }) },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(budgetId: string, data: CreateRevenueData): Promise<Revenue> {
    const row = await this.prisma.revenue.create({
      data: {
        budgetId,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        categoryId: data.categoryId,
        personId: data.personId,
        frequency_value: data.frequencyValue,
        start_date: data.startDate,
        end_date: data.endDate,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateRevenueData): Promise<Revenue> {
    try {
      const row = await this.prisma.revenue.update({
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
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Revenue ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.revenue.delete({ where: { id } });
  }

  private toDomain(row: PrismaRevenue): Revenue {
    return new Revenue(
      row.id,
      row.budgetId,
      row.name,
      Number(row.amount),
      row.frequency as Frequency,
      row.created_at,
      row.updated_at,
      row.categoryId,
      row.personId,
      row.frequency_value,
      row.start_date,
      row.end_date
    );
  }
}
