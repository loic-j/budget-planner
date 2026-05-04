import type { CategoryType } from '../constants/presetCategories.js';

export { CategoryType };

export class Category {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly type: CategoryType,
    public readonly name: string,
    public readonly icon: string,
    public readonly isPreset: boolean,
    public readonly createdAt: Date
  ) {}
}
