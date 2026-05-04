import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Asset as PrismaAsset } from '@prisma/client';
import { Asset } from '../../../domains/assets/entities/Asset.js';
import type {
  IAssetRepository,
  CreateAssetData,
  UpdateAssetData,
} from '../../../domains/assets/repositories/IAssetRepository.js';
import type { AssetType } from '../../../domains/assets/entities/Asset.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaAssetRepository implements IAssetRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Asset | null> {
    const row = await this.prisma.asset.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string): Promise<Asset[]> {
    const rows = await this.prisma.asset.findMany({
      where: { budgetId },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(budgetId: string, data: CreateAssetData): Promise<Asset> {
    const row = await this.prisma.asset.create({
      data: {
        budgetId,
        type: data.type,
        name: data.name,
        current_value: data.currentValue,
        acquisition_date: data.acquisitionDate,
        annual_growth_rate: data.annualGrowthRate,
        loanDetailId: data.loanDetailId,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    try {
      const row = await this.prisma.asset.update({
        where: { id },
        data: {
          ...(data.type !== undefined && { type: data.type }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.currentValue !== undefined && { current_value: data.currentValue }),
          ...(data.acquisitionDate !== undefined && { acquisition_date: data.acquisitionDate }),
          ...(data.annualGrowthRate !== undefined && { annual_growth_rate: data.annualGrowthRate }),
          ...(data.loanDetailId !== undefined && { loanDetailId: data.loanDetailId }),
        },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Asset ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({ where: { id } });
  }

  private toDomain(row: PrismaAsset): Asset {
    return new Asset(
      row.id,
      row.budgetId,
      row.type as AssetType,
      row.name,
      Number(row.current_value),
      row.acquisition_date,
      Number(row.annual_growth_rate),
      row.created_at,
      row.updated_at,
      row.loanDetailId
    );
  }
}
