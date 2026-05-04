export type AssetType = 'REAL_ESTATE' | 'INVESTMENT' | 'VEHICLE' | 'OTHER';

export class Asset {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly type: AssetType,
    public readonly name: string,
    public readonly currentValue: number,
    public readonly acquisitionDate: Date,
    public readonly annualGrowthRate: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly loanDetailId: string | null = null
  ) {}

  valueAt(date: Date): number {
    const factor = 1 + this.annualGrowthRate / 100;
    if (factor <= 0) return 0;
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    const years = (date.getTime() - this.acquisitionDate.getTime()) / msPerYear;
    return Math.max(0, this.currentValue * Math.pow(factor, years));
  }
}
