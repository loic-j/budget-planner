import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { BudgetInvite as PrismaInvite } from '@prisma/client';
import { BudgetInvite, type InviteRole } from '../../../domains/budget/entities/BudgetInvite.js';
import type {
  IBudgetInviteRepository,
  CreateInviteData,
} from '../../../domains/budget/repositories/IBudgetInviteRepository.js';

@injectable()
export class PrismaBudgetInviteRepository implements IBudgetInviteRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findByToken(token: string): Promise<BudgetInvite | null> {
    const row = await this.prisma.budgetInvite.findUnique({ where: { token } });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string): Promise<BudgetInvite[]> {
    const rows = await this.prisma.budgetInvite.findMany({
      where: { budgetId },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(data: CreateInviteData): Promise<BudgetInvite> {
    const row = await this.prisma.budgetInvite.create({
      data: {
        budgetId: data.budgetId,
        token: data.token,
        role: data.role,
        createdBy: data.createdBy,
        expires_at: data.expiresAt,
        max_uses: data.maxUses,
      },
    });
    return this.toDomain(row);
  }

  async incrementUseCount(id: string): Promise<void> {
    await this.prisma.budgetInvite.update({
      where: { id },
      data: { use_count: { increment: 1 } },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.budgetInvite.delete({ where: { id } });
  }

  private toDomain(row: PrismaInvite): BudgetInvite {
    return new BudgetInvite(
      row.id,
      row.budgetId,
      row.token,
      row.role as InviteRole,
      row.createdBy,
      row.created_at,
      row.expires_at,
      row.max_uses,
      row.use_count
    );
  }
}
