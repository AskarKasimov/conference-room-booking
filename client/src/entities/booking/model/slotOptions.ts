import { DateTime } from 'luxon';
import type { Office } from '../../office';
import { buildOfficeInterval, MAX_BOOKING_DAYS } from '../../../shared/lib';

export function getBookableDate(timezone: string, now = new Date()): string {
  const local = DateTime.fromJSDate(now).setZone(timezone);
  const date = local.hour >= 20 ? local.plus({ days: 1 }) : local;
  return date.toISODate() ?? '';
}

export function getNextSlot(
  timezone: string,
  now = new Date(),
): { date: string; startTime: string } {
  let local = DateTime.fromJSDate(now).setZone(timezone).plus({ minutes: 1 }).startOf('minute');
  const roundedMinute = Math.ceil(local.minute / 15) * 15;
  local = local.set({ minute: roundedMinute, second: 0, millisecond: 0 });
  if (local.hour < 9) local = local.set({ hour: 9, minute: 0 });
  if (local.hour >= 20) local = local.plus({ days: 1 }).set({ hour: 9, minute: 0 });
  return { date: local.toISODate() ?? '', startTime: local.toFormat('HH:mm') };
}

export function getDefaultRoomFilters(office: Office, now = new Date()) {
  const slot = getNextSlot(office.timezone, now);
  return { ...slot, duration: getDefaultDuration(slot.startTime) };
}

export function getDefaultDuration(startTime: string) {
  return Math.min(60, getDurationOptions(startTime).at(-1) ?? 60);
}

export function getTimeOptions() {
  return Array.from({ length: 44 }, (_, index) => {
    const minutes = 9 * 60 + index * 15;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  });
}

export function getBookableDateBounds(timezone: string, now = new Date()) {
  const current = DateTime.fromJSDate(now).setZone(timezone);
  const horizon = DateTime.fromJSDate(now).plus({ days: MAX_BOOKING_DAYS }).setZone(timezone);
  return { min: current.toISODate() ?? '', max: horizon.toISODate() ?? '' };
}

export function getBookableTimeOptions(date: string, timezone: string, now = new Date()) {
  return getTimeOptions().filter((startTime) => {
    try {
      buildOfficeInterval({ date, startTime, durationMinutes: 15, timezone, now });
      return true;
    } catch {
      return false;
    }
  });
}

export function getDurationOptions(startTime: string) {
  const [hour, minute] = startTime.split(':').map(Number);
  if (hour === undefined || minute === undefined) return [];
  const remaining = 20 * 60 - (hour * 60 + minute);
  return Array.from(
    { length: Math.max(0, Math.floor(remaining / 15)) },
    (_, index) => (index + 1) * 15,
  );
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const lastTwoDigits = hours % 100;
  const lastDigit = hours % 10;
  const hourWord =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? 'часов'
      : lastDigit === 1
        ? 'час'
        : lastDigit >= 2 && lastDigit <= 4
          ? 'часа'
          : 'часов';
  return [
    hours ? (remainingMinutes ? `${hours} ч` : `${hours} ${hourWord}`) : '',
    remainingMinutes ? `${remainingMinutes} мин` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
