import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import type { RoomSummary } from '../../api/contracts';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Alert } from '../../components/ui/Alert';
import { Select } from '../../components/ui/Select';
import { formatDuration, getDurationOptions, getTimeOptions } from '../room-search/searchParams';
import { buildOfficeInterval } from '../../lib/time';
import { BookingSuccessNotice } from './BookingSuccessNotice';
import { createBookingSchema, type BookingFormValues } from './bookingSchema';
import { useCreateBookingMutation } from './useCreateBookingMutation';
import styles from './Booking.module.scss';

export interface BookingSelection {
  room: RoomSummary;
  date: string;
  startTime: string;
  durationMinutes: number;
}

export function BookingDialog({
  selection,
  open,
  onOpenChange,
  onSuccess,
}: {
  selection: BookingSelection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [success, setSuccess] = useState(false);
  const mutation = useCreateBookingMutation();
  const schema = createBookingSchema({ timezone: selection.room.office.timezone });
  const form = useForm<
    z.input<ReturnType<typeof createBookingSchema>>,
    undefined,
    BookingFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      comment: '',
      date: selection.date,
      startTime: selection.startTime,
      durationMinutes: selection.durationMinutes,
    },
  });
  const onSubmit = async (values: BookingFormValues) => {
    const interval = buildOfficeInterval({ ...values, timezone: selection.room.office.timezone });
    try {
      await mutation.mutateAsync({
        roomId: selection.room.id,
        title: values.title,
        comment: values.comment?.trim() || null,
        startsAt: interval.from,
        endsAt: interval.to,
      });
    } catch {
      return;
    }
    setSuccess(true);
    onSuccess?.();
    onOpenChange(false);
  };
  const durationOptions = getDurationOptions(form.watch('startTime'));
  if (success) return <BookingSuccessNotice />;
  const mutationError = mutation.error;
  return (
    <Dialog open={open} title="Забронировать комнату" onOpenChange={onOpenChange}>
      <p>
        {selection.room.name} · {selection.startTime} на {formatDuration(selection.durationMinutes)}
      </p>
      {mutationError ? (
        <Alert variant="error">
          {mutationError instanceof ApiError
            ? mutationError.message
            : 'Не удалось создать бронирование'}
        </Alert>
      ) : null}
      <form className={styles.form} onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <label>
          Название встречи
          <input {...form.register('title')} aria-invalid={Boolean(form.formState.errors.title)} />
        </label>
        {form.formState.errors.title ? (
          <span className={styles.error}>{form.formState.errors.title.message}</span>
        ) : null}
        <label>
          Комментарий
          <textarea {...form.register('comment')} />
        </label>
        <label>
          Дата
          <input type="date" {...form.register('date')} />
        </label>
        <Select
          label="Время начала"
          value={form.watch('startTime')}
          onValueChange={(startTime) => {
            const nextDurationOptions = getDurationOptions(startTime);
            form.setValue('startTime', startTime, { shouldValidate: true });
            if (!nextDurationOptions.includes(Number(form.getValues('durationMinutes'))))
              form.setValue('durationMinutes', nextDurationOptions.at(-1) ?? 15, {
                shouldValidate: true,
              });
          }}
          options={getTimeOptions().map((time) => ({ value: time, label: time }))}
        />
        <label>
          Продолжительность
          <select {...form.register('durationMinutes', { valueAsNumber: true })}>
            {durationOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </select>
        </label>
        {form.formState.errors.startTime ? (
          <span className={styles.error}>{form.formState.errors.startTime.message}</span>
        ) : null}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Отмена
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Забронировать
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
