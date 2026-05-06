import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Contact, ContactWithMeta } from '@/lib/types';
import { frequencyToDays } from '@/lib/frequencies';
import { differenceInDays, parseISO } from 'date-fns';

export function useContacts() {
  const [contacts, setContacts] = useState<ContactWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('contacts')
      .select('*')
      .order('name');

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const now = new Date();
    const enriched: ContactWithMeta[] = (data as Contact[]).map((c) => {
      const days = c.last_contacted_at
        ? differenceInDays(now, parseISO(c.last_contacted_at))
        : null;
      const threshold = frequencyToDays(c.reminder_frequency);
      const is_overdue = days === null ? true : days >= threshold;
      return { ...c, days_since_contact: days, is_overdue };
    });

    enriched.sort((a, b) => {
      const aDays = a.days_since_contact ?? 9999;
      const bDays = b.days_since_contact ?? 9999;
      return bDays - aDays;
    });

    setContacts(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { contacts, loading, error, refresh: load };
}
