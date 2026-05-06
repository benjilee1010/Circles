import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Contact, ImportantDate, Interaction } from '@/lib/types';

export function useContact(id: string) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: d }, { data: i }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).single(),
      supabase.from('important_dates').select('*').eq('contact_id', id).order('date'),
      supabase.from('interactions').select('*').eq('contact_id', id).order('date', { ascending: false }),
    ]);
    if (c) setContact(c as Contact);
    if (d) setImportantDates(d as ImportantDate[]);
    if (i) setInteractions(i as Interaction[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { contact, importantDates, interactions, loading, refresh: load };
}
