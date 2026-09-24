import * as Notifications from 'expo-notifications';
import { Item } from './domain';
import { reminderDate } from './notification-date';
export { reminderDate } from './notification-date';

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelItemReminder(itemId: string) {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.filter(n => n.content.data?.itemId === itemId).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleItemReminder(item: Item) {
  await cancelItemReminder(item.id);
  const date = reminderDate(item.expiry, item.reminderDays);
  if (!date) return null;
  const trigger = new Date(`${date}T09:00:00`);
  if (trigger.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({ content: { title: `${item.name} 即将过期`, body: `还有 ${item.reminderDays} 天到期，请及时处理。`, data: { itemId: item.id } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger } });
}

export async function rescheduleAllReminders(items: Item[]) {
  await Promise.all(items.map(scheduleItemReminder));
}
