import { injectable, inject } from 'tsyringe';
import type { ICategoryRepository } from '../repositories/ICategoryRepository.js';
import { PRESET_CATEGORIES } from '../constants/presetCategories.js';

@injectable()
export class SeedPresetCategoriesUseCase {
  constructor(@inject('ICategoryRepository') private categoryRepo: ICategoryRepository) {}

  async execute(budgetId: string): Promise<void> {
    await this.categoryRepo.bulkCreate(
      budgetId,
      PRESET_CATEGORIES.map((p) => ({ ...p, isPreset: true }))
    );
  }
}
