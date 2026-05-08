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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: contactData, error: contactErr }, { data: interactionData }] =
      await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user.id).order('name'),
        supabase.from('interactions').select('contact_id, date, type'),
      ]);

    if (contactErr) {
      setError(contactErr.message);
      setLoading(false);
      return;
    }

    // Build maps: contact_id → latest date per type
    const lastHungOut = new Map<string, string>();
    const lastKeptInTouch = new Map<string, string>();

    for (const row of (interactionData ?? [])) {
      if (row.type === 'hung_out') {
        const cur = lastHungOut.get(row.contact_id);
        if (!cur || row.date > cur) lastHungOut.set(row.contact_id, row.date);
      } else if (row.type === 'kept_in_touch') {
        const cur = lastKeptInTouch.get(row.contact_id);
        if (!cur || row.date > cur) lastKeptInTouch.set(row.contact_id, row.date);
      }
    }

    const now = new Date();
    const enriched: ContactWithMeta[] = (contactData as Contact[]).map((c) => {
      const days = c.last_contacted_at
        ? differenceInDays(now, parseISO(c.last_contacted_at))
        : null;
      const threshold = frequencyToDays(c.reminder_frequency);
      const is_overdue = days === null ? true : days >= threshold;

      const hoDate = lastHungOut.get(c.id) ?? null;
      const kitDate = lastKeptInTouch.get(c.id) ?? null;

      return {
        ...c,
        days_since_contact: days,
        is_overdue,
        last_hung_out_at: hoDate,
        last_kept_in_touch_at: kitDate,
        days_since_hung_out: hoDate ? differenceInDays(now, parseISO(hoDate)) : null,
        days_since_kept_in_touch: kitDate ? differenceInDays(now, parseISO(kitDate)) : null,
      };
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
