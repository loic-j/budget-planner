export type CategoryType = 'EXPENSE' | 'REVENUE' | 'SAVING';

export interface PresetCategory {
  name: string;
  icon: string;
  type: CategoryType;
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  // Expenses
  { type: 'EXPENSE', name: 'Food', icon: 'food' },
  { type: 'EXPENSE', name: 'Housing', icon: 'home' },
  { type: 'EXPENSE', name: 'Transportation', icon: 'car' },
  { type: 'EXPENSE', name: 'Entertainment', icon: 'entertainment' },
  { type: 'EXPENSE', name: 'Health', icon: 'health' },
  { type: 'EXPENSE', name: 'Personal care', icon: 'person' },
  { type: 'EXPENSE', name: 'Travel', icon: 'plane' },
  { type: 'EXPENSE', name: 'Gift', icon: 'gift' },
  { type: 'EXPENSE', name: 'Education – Kindergarten', icon: 'school-kindergarten' },
  { type: 'EXPENSE', name: 'Education – Primary school', icon: 'school-primary' },
  { type: 'EXPENSE', name: 'Education – Junior high', icon: 'school-junior' },
  { type: 'EXPENSE', name: 'Education – High school', icon: 'school-high' },
  { type: 'EXPENSE', name: 'University', icon: 'university' },
  { type: 'EXPENSE', name: 'Other', icon: 'other' },

  // Revenues
  { type: 'REVENUE', name: 'Salary', icon: 'salary' },
  { type: 'REVENUE', name: 'Freelance', icon: 'freelance' },
  { type: 'REVENUE', name: 'Pension', icon: 'pension' },
  { type: 'REVENUE', name: 'Unemployment benefit', icon: 'unemployment' },
  { type: 'REVENUE', name: 'Other', icon: 'other' },

  // Savings
  { type: 'SAVING', name: 'Emergency fund', icon: 'shield' },
  { type: 'SAVING', name: 'Retirement', icon: 'retirement' },
  { type: 'SAVING', name: 'Other', icon: 'other' },
];

export const PRESET_EXPENSE_CATEGORIES = PRESET_CATEGORIES.filter((c) => c.type === 'EXPENSE');
export const PRESET_REVENUE_CATEGORIES = PRESET_CATEGORIES.filter((c) => c.type === 'REVENUE');
export const PRESET_SAVING_CATEGORIES = PRESET_CATEGORIES.filter((c) => c.type === 'SAVING');
