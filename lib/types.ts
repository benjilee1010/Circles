export type ReminderFrequency =
  | 'weekly' | 'biweekly' | 'triweekly'
  | '1m' | '2m' | '3m' | '4m' | '5m' | '6m'
  | '7m' | '8m' | '9m' | '10m' | '11m' | '12m'
  | 'annually';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  birthday: string | null;
  notes: string | null;
  avatar_url: string | null;
  category: string | null;
  reminder_frequency: ReminderFrequency;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  is_regular_hangout: boolean;
  is_regular_checkin: boolean;
}

export interface ImportantDate {
  id: string;
  contact_id: string;
  label: string;
  date: string;
}

export type InteractionType = 'hung_out' | 'kept_in_touch';

export interface Interaction {
  id: string;
  contact_id: string;
  date: string;
  type: InteractionType;
  note: string | null;
  created_at: string;
}

export type ContactWithMeta = Contact & {
  days_since_contact: number | null;
  is_overdue: boolean;
  last_hung_out_at: string | null;
  last_kept_in_touch_at: string | null;
  days_since_hung_out: number | null;
  days_since_kept_in_touch: number | null;
  birthday_soon: boolean;
};
