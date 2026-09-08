import { DateTime } from 'luxon';

export const WORKDAY_START = '09:00';
export const WORKDAY_END = '20:00';
export const SLOT_MINUTES = 15;
export const MAX_BOOKING_DAYS = 30;

export interface TimeInterval {
  from: string;
  to: string;
}

export interface OfficeInterval extends TimeInterval {
  date: string;
  startTime: string;
  durationMinutes: number;
}

interface BuildOfficeIntervalInput {
  date: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  now?: Date;
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function localDateTime(date: string, time: string, timezone: string): DateTime {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !timePattern.test(time)) {
    throw new Error('Укажите корректную дату и время');
  }
  const value = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  if (!value.isValid) throw new Error('Укажите корректную дату и время');
  return value.set({ second: 0, millisecond: 0 });
}

function ensureQuarterHour(value: DateTime): void {
  if (value.minute % SLOT_MINUTES !== 0 || value.second !== 0 || value.millisecond !== 0) {
    throw new Error('Время должно быть кратно 15 минутам');
  }
}

export function toApiIso(date: string, time: string, timezone: string): string {
  const value = localDateTime(date, time, timezone);
  ensureQuarterHour(value);
  return value.toISO({ suppressMilliseconds: false, includeOffset: true }) ?? '';
}

export function buildOfficeInterval({
  date,
  startTime,
  durationMinutes,
  timezone,
  now = new Date(),
}: BuildOfficeIntervalInput): OfficeInterval {
  if (durationMinutes < SLOT_MINUTES || durationMinutes % SLOT_MINUTES !== 0) {
    throw new Error('Продолжительность должна быть кратна 15 минутам');
  }

  const start = localDateTime(date, startTime, timezone);
  ensureQuarterHour(start);
  const end = start.plus({ minutes: durationMinutes });
  const nowInstant = DateTime.fromJSDate(now);
  const startInstant = start.toUTC();
  const endMinutes = end.hour * 60 + end.minute;
  const startMinutes = start.hour * 60 + start.minute;

  if (startInstant <= nowInstant.toUTC())
    throw new Error('Бронирование можно создать только на будущее');
  if (
    startInstant.diff(nowInstant.toUTC(), 'milliseconds').milliseconds >
    MAX_BOOKING_DAYS * 24 * 60 * 60 * 1000
  ) {
    throw new Error('Бронирование доступно не более чем на 30 дней вперёд');
  }
  if (startMinutes < 9 * 60 || endMinutes > 20 * 60 || end.toISODate() !== start.toISODate()) {
    throw new Error('Бронирование должно быть в рабочих часах с 09:00 до 20:00');
  }

  return {
    date,
    startTime,
    durationMinutes,
    from: start.toISO({ suppressMilliseconds: false, includeOffset: true }) ?? '',
    to: end.toISO({ suppressMilliseconds: false, includeOffset: true }) ?? '',
  };
}

export function getWorkdayInterval(date: string, timezone: string): TimeInterval {
  return {
    from: toApiIso(date, WORKDAY_START, timezone),
    to: toApiIso(date, WORKDAY_END, timezone),
  };
}

export function intervalsOverlap(first: TimeInterval, second: TimeInterval): boolean {
  const firstStart = Date.parse(first.from);
  const firstEnd = Date.parse(first.to);
  const secondStart = Date.parse(second.from);
  const secondEnd = Date.parse(second.to);
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function formatLocalDate(value: string, timezone: string): string {
  return DateTime.fromISO(value, { setZone: true }).setZone(timezone).toFormat('dd.MM.yyyy');
}

export function formatLocalTime(value: string, timezone: string): string {
  return DateTime.fromISO(value, { setZone: true }).setZone(timezone).toFormat('HH:mm');
}

export function formatMoscowOffset(timezone: string, value: string): string {
  const local = DateTime.fromISO(value, { setZone: true }).setZone(timezone);
  const offset = local.offset - local.setZone('Europe/Moscow').offset;
  if (!Number.isFinite(offset)) return '';
  if (offset === 0) return 'MSK';
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const suffix = `${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
  return `MSK${offset > 0 ? '+' : '-'}${suffix}`;
}
