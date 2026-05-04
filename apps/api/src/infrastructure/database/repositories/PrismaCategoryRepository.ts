import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Category as PrismaCategory } from '@prisma/client';
import { Category } from '../../../domains/categories/entities/Category.js';
import type {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../../domains/categories/repositories/ICategoryRepository.js';
import type { CategoryType } from '../../../domains/categories/entities/Category.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string, type?: CategoryType): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { budgetId, ...(type && { type }) },
      orderBy: [{ is_preset: 'desc' }, { created_at: 'asc' }],
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(budgetId: string, data: CreateCategoryData): Promise<Category> {
    const row = await this.prisma.category.create({
      data: {
        budgetId,
        type: data.type,
        name: data.name,
        icon: data.icon,
        is_preset: data.isPreset ?? false,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.icon !== undefined && { icon: data.icon }),
        },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Category ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async bulkCreate(budgetId: string, items: CreateCategoryData[]): Promise<void> {
    await this.prisma.category.createMany({
      data: items.map((item) => ({
        budgetId,
        type: item.type,
        name: item.name,
        icon: item.icon,
        is_preset: item.isPreset ?? false,
      })),
    });
  }

  private toDomain(row: PrismaCategory): Category {
    return new Category(
      row.id,
      row.budgetId,
      row.type as CategoryType,
      row.name,
      row.icon,
      row.is_preset,
      row.created_at
    );
  }
}
