import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  async function refresh() {
    const { data } = await supabase
      .from('contacts')
      .select('category')
      .not('category', 'is', null);

    if (data) {
      const unique = [...new Set(data.map((r: any) => r.category).filter(Boolean))] as string[];
      const custom = unique.filter((c) => !CATEGORIES.includes(c));
      setCustomCategories(custom);
    }
  }

  useEffect(() => { refresh(); }, []);

  const allCategories = [...CATEGORIES, ...customCategories];
  return { allCategories, refresh };
}
