import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { BudgetMember as PrismaMember, User as PrismaUser } from '@prisma/client';
import { BudgetMember } from '../../../domains/budget/entities/BudgetMember.js';
import type { IBudgetMemberRepository } from '../../../domains/budget/repositories/IBudgetMemberRepository.js';
import type { BudgetRole } from '../../../domains/budget/entities/Budget.js';

type MemberWithUser = PrismaMember & { user: PrismaUser };

@injectable()
export class PrismaBudgetMemberRepository implements IBudgetMemberRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findByBudget(budgetId: string): Promise<BudgetMember[]> {
    const rows = await this.prisma.budgetMember.findMany({
      where: { budgetId },
      include: { user: true },
      orderBy: { joined_at: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByBudgetAndUser(budgetId: string, userId: string): Promise<BudgetMember | null> {
    const row = await this.prisma.budgetMember.findUnique({
      where: { budgetId_userId: { budgetId, userId } },
      include: { user: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(budgetId: string, userId: string, role: BudgetRole): Promise<BudgetMember> {
    const row = await this.prisma.budgetMember.create({
      data: { budgetId, userId, role },
      include: { user: true },
    });
    return this.toDomain(row);
  }

  async updateRole(budgetId: string, userId: string, role: BudgetRole): Promise<BudgetMember> {
    const row = await this.prisma.budgetMember.update({
      where: { budgetId_userId: { budgetId, userId } },
      data: { role },
      include: { user: true },
    });
    return this.toDomain(row);
  }

  async delete(budgetId: string, userId: string): Promise<void> {
    await this.prisma.budgetMember.delete({
      where: { budgetId_userId: { budgetId, userId } },
    });
  }

  private toDomain(row: MemberWithUser): BudgetMember {
    return new BudgetMember(
      row.id,
      row.budgetId,
      row.userId,
      row.role as BudgetRole,
      row.joined_at,
      row.user.email,
      row.user.name ?? null
    );
  }
}
