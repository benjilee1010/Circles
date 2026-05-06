import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Contact } from './types';
import { frequencyToDays } from './frequencies';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('circles', {
      name: 'Circles reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleContactReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { data: contacts } = await supabase.from('contacts').select('*');
  if (!contacts) return;

  const now = new Date();

  for (const contact of contacts as Contact[]) {
    const threshold = frequencyToDays(contact.reminder_frequency);
    const lastDate = contact.last_contacted_at ? parseISO(contact.last_contacted_at) : null;
    const daysSince = lastDate ? differenceInDays(now, lastDate) : threshold + 1;

    if (daysSince >= threshold) {
      // Schedule for tomorrow morning (already overdue)
      const trigger = new Date(now);
      trigger.setDate(trigger.getDate() + 1);
      trigger.setHours(9, 0, 0, 0);
      await scheduleNotification(contact.name, trigger);
    } else {
      // Schedule for when they'll be overdue
      const dueDate = addDays(lastDate ?? now, threshold);
      dueDate.setHours(9, 0, 0, 0);
      if (dueDate > now) {
        await scheduleNotification(contact.name, dueDate);
      }
    }
  }
}

async function scheduleNotification(name: string, date: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to reach out to ${name}`,
      body: `You haven't connected in a while. Send them a message?`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}
