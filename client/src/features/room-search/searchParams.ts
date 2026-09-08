import { DateTime } from 'luxon';
import { z } from 'zod';
import type { Office } from '../../api/contracts';

export const roomsSearchSchema = z.object({
  officeId: z.string().trim().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  duration: z.coerce.number().int().positive().optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
});

export type RoomsSearch = z.infer<typeof roomsSearchSchema>;

export function normalizeRoomsSearch(search: Record<string, unknown>): RoomsSearch {
  const officeId =
    typeof search.officeId === 'string' && search.officeId.trim()
      ? search.officeId.trim()
      : undefined;
  const date = typeof search.date === 'string' ? search.date : undefined;
  const validDate =
    date && DateTime.fromISO(date).isValid && DateTime.fromISO(date).toISODate() === date
      ? date
      : undefined;
  const startTime = typeof search.startTime === 'string' ? search.startTime : undefined;
  const parsedTime = startTime ? /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) : false;
  const duration = Number(search.duration);
  const minCapacity = Number(search.minCapacity);
  return {
    officeId,
    date: validDate,
    startTime: parsedTime ? startTime : undefined,
    duration: Number.isInteger(duration) && duration > 0 ? duration : undefined,
    minCapacity: Number.isInteger(minCapacity) && minCapacity > 0 ? minCapacity : undefined,
  };
}

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

export function getDurationOptions(startTime: string) {
  const [hour, minute] = startTime.split(':').map(Number);
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
