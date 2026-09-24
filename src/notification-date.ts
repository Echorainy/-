import { parseDate, localDate } from './domain.ts';
export function reminderDate(expiry: string | undefined, leadDays: number) {
  const date = parseDate(expiry);
  if (!date || !Number.isFinite(leadDays) || leadDays < 0) return null;
  date.setDate(date.getDate() - Math.floor(leadDays));
  return localDate(date);
}
