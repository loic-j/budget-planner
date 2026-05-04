import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Saving as PrismaSaving } from '@prisma/client';
import { Saving } from '../../../domains/savings/entities/Saving.js';
import type {
  ISavingRepository,
  CreateSavingData,
  UpdateSavingData,
} from '../../../domains/savings/repositories/ISavingRepository.js';
import type { Frequency } from '../../../domains/savings/entities/Saving.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaSavingRepository implements ISavingRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Saving | null> {
    const row = await this.prisma.saving.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string, personId?: string): Promise<Saving[]> {
    const rows = await this.prisma.saving.findMany({
      where: { budgetId, ...(personId && { personId }) },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(budgetId: string, data: CreateSavingData): Promise<Saving> {
    const row = await this.prisma.saving.create({
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
        target_amount: data.targetAmount,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateSavingData): Promise<Saving> {
    try {
      const row = await this.prisma.saving.update({
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
          ...(data.targetAmount !== undefined && { target_amount: data.targetAmount }),
        },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Saving ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.saving.delete({ where: { id } });
  }

  private toDomain(row: PrismaSaving): Saving {
    return new Saving(
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
      row.end_date,
      row.target_amount !== null ? Number(row.target_amount) : null
    );
  }
}
