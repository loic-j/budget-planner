import { useTranslation } from 'react-i18next';

interface TranslatableCategory {
  name: string;
  icon: string;
  type: string;
  isPreset: boolean;
}

export function useCatName() {
  const { t } = useTranslation();
  return (cat: TranslatableCategory): string => {
    if (cat.isPreset) {
      return t(`cat.${cat.type.toLowerCase()}.${cat.icon}`, { defaultValue: cat.name });
    }
    return cat.name;
  };
}
