import { z } from 'zod';
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
      durationMinutes: z.coerce.number().int().positive(),
    })
    .superRefine((value, context) => {
      try {
        buildOfficeInterval({ ...value, timezone, ...(now !== undefined ? { now } : {}) });
      } catch (error) {
        context.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: error instanceof Error ? error.message : 'Проверьте интервал',
        });
      }
    });

export type BookingFormValues = z.infer<ReturnType<typeof createBookingSchema>>;
