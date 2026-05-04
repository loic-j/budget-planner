export type InviteRole = 'EDITOR' | 'VIEWER';

export class BudgetInvite {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly token: string,
    public readonly role: InviteRole,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date | null,
    public readonly maxUses: number | null,
    public readonly useCount: number
  ) {}

  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }

  get isMaxUsesReached(): boolean {
    if (this.maxUses === null) return false;
    return this.useCount >= this.maxUses;
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isMaxUsesReached;
  }
}
