import type { Category, CategoryType } from '../entities/Category.js';

export interface CreateCategoryData {
  type: CategoryType;
  name: string;
  icon: string;
  isPreset?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByBudget(budgetId: string, type?: CategoryType): Promise<Category[]>;
  create(budgetId: string, data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
  bulkCreate(budgetId: string, items: CreateCategoryData[]): Promise<void>;
}
