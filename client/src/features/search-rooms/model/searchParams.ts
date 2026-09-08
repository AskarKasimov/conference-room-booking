import { DateTime } from 'luxon';
import { z } from 'zod';

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
