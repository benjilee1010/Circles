import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Contact, ImportantDate, Interaction } from '@/lib/types';

export function useContact(id: string | string[] | undefined) {
  // Normalise: expo-router can return string[] for dynamic params
  const contactId = Array.isArray(id) ? id[0] : id ?? '';

  const [contact, setContact] = useState<Contact | null>(null);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contactId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const [
      { data: c, error: cErr },
      { data: d, error: dErr },
      { data: i, error: iErr },
    ] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      supabase.from('important_dates').select('*').eq('contact_id', contactId).order('date'),
      supabase.from('interactions').select('*').eq('contact_id', contactId).order('date', { ascending: false }),
    ]);

    if (cErr || !c) {
      setError(cErr?.message ?? 'Contact not found');
      setLoading(false);
      return;
    }

    setContact(c as Contact);
    setImportantDates((d as ImportantDate[]) ?? []);
    setInteractions((i as Interaction[]) ?? []);
    if (dErr) console.warn('important_dates fetch error:', dErr.message);
    if (iErr) console.warn('interactions fetch error:', iErr.message);
    setLoading(false);
  }, [contactId]);

  useEffect(() => { load(); }, [load]);

  return { contact, importantDates, interactions, loading, error, refresh: load };
}
