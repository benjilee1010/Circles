import { CATEGORIES } from '@/lib/categories';

export function useCategories() {
  return { allCategories: CATEGORIES, refresh: () => {} };
}
