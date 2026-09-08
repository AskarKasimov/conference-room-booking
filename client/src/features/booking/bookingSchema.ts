import { z } from 'zod';
import { DateTime } from 'luxon';
import { SLOT_MINUTES } from '../../lib/time';
import { buildOfficeInterval } from '../../lib/time';

export interface BookingSchemaOptions {
  now?: Date;
  timezone: string;
}

export const createBookingSchema = ({ now, timezone }: BookingSchemaOptions) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(1, 'Укажите название встречи')
        .max(200, 'Название не должно быть длиннее 200 символов'),
      comment: z
        .string()
        .trim()
        .max(2000, 'Комментарий не должен быть длиннее 2000 символов')
        .nullable()
        .optional(),
      date: z.string().min(1, 'Укажите дату'),
      startTime: z.string().min(1, 'Укажите время начала'),
      durationMinutes: z.coerce
        .number({ error: 'Выберите продолжительность' })
        .int('Продолжительность должна быть целым числом минут')
        .min(SLOT_MINUTES, 'Продолжительность должна быть не менее 15 минут')
        .multipleOf(SLOT_MINUTES, 'Продолжительность должна быть кратна 15 минутам'),
    })
    .superRefine((value, context) => {
      const date = DateTime.fromISO(value.date, { zone: timezone });
      if (!date.isValid || date.toISODate() !== value.date) {
        context.addIssue({ code: 'custom', path: ['date'], message: 'Укажите корректную дату' });
        return;
      }
      if (value.durationMinutes < SLOT_MINUTES || value.durationMinutes % SLOT_MINUTES !== 0) {
        context.addIssue({
          code: 'custom',
          path: ['durationMinutes'],
          message: 'Продолжительность должна быть не менее 15 минут и кратна 15 минутам',
        });
        return;
      }
      try {
        buildOfficeInterval({ ...value, timezone, ...(now !== undefined ? { now } : {}) });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Проверьте интервал';
        const path = message.includes('в будущем')
          ? 'startTime'
          : message.includes('30 дней')
            ? 'date'
            : message.includes('рабочих часах') && value.startTime >= '09:00'
              ? 'durationMinutes'
              : 'startTime';
        context.addIssue({
          code: 'custom',
          path: [path],
          message,
        });
      }
    });

export type BookingFormValues = z.infer<ReturnType<typeof createBookingSchema>>;
