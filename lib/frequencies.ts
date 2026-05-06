import { ReminderFrequency } from './types';

export const FREQUENCY_OPTIONS: { label: string; value: ReminderFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: '1m' },
  { label: 'Every 2 months', value: '2m' },
  { label: 'Every 3 months', value: '3m' },
  { label: 'Every 4 months', value: '4m' },
  { label: 'Every 5 months', value: '5m' },
  { label: 'Every 6 months', value: '6m' },
  { label: 'Every 7 months', value: '7m' },
  { label: 'Every 8 months', value: '8m' },
  { label: 'Every 9 months', value: '9m' },
  { label: 'Every 10 months', value: '10m' },
  { label: 'Every 11 months', value: '11m' },
  { label: 'Every year', value: '12m' },
  { label: 'Annually', value: 'annually' },
];

export function frequencyToDays(freq: ReminderFrequency): number {
  if (freq === 'weekly') return 7;
  if (freq === 'annually') return 365;
  const months = parseInt(freq.replace('m', ''), 10);
  return months * 30;
}

export function frequencyLabel(freq: ReminderFrequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === freq)?.label ?? freq;
}
