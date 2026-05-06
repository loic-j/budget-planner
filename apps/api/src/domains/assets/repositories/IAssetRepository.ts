import type { Asset, AssetType } from '../entities/Asset.js';

export interface CreateAssetData {
  type: AssetType;
  name: string;
  currentValue: number;
  acquisitionDate: Date;
  annualGrowthRate: number;
  loanDetailId?: string;
  sourceRevenueId?: string;
  sourceExpenseId?: string;
}

export interface UpdateAssetData {
  type?: AssetType;
  name?: string;
  currentValue?: number;
  acquisitionDate?: Date;
  annualGrowthRate?: number;
  loanDetailId?: string | null;
  sourceRevenueId?: string | null;
  sourceExpenseId?: string | null;
}

export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>;
  findByBudget(budgetId: string): Promise<Asset[]>;
  create(budgetId: string, data: CreateAssetData): Promise<Asset>;
  update(id: string, data: UpdateAssetData): Promise<Asset>;
  delete(id: string): Promise<void>;
}
