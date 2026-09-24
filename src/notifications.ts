import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

export const notificationsAvailable = Platform.OS !== 'web' && !isRunningInExpoGo();

// Do not evaluate the library in Expo Go: its push listener runs on import.
const loadNotifications = () => import('expo-notifications');

export async function initializeNotifications() {
  if (!notificationsAvailable) return false;
  const Notifications = await loadNotifications();
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('expiry', { name: '保质期提醒', importance: Notifications.AndroidImportance.DEFAULT });
  return (await Notifications.getPermissionsAsync()).granted;
}
import { Item } from './domain';
import { reminderDate } from './notification-date';
export { reminderDate } from './notification-date';

export async function requestNotificationPermission() {
  if (!notificationsAvailable) return false;
  const Notifications = await loadNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelItemReminder(itemId: string) {
  if (!notificationsAvailable) return;
  const Notifications = await loadNotifications();
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.filter(n => n.content.data?.itemId === itemId).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleItemReminder(item: Item) {
  if (!notificationsAvailable) return null;
  const Notifications = await loadNotifications();
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
