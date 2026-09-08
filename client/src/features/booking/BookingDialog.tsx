import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import type { RoomSummary } from '../../api/contracts';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Alert } from '../../components/ui/Alert';
import { DatePicker } from '../../components/ui/DatePicker';
import { Select } from '../../components/ui/Select';
import { formatDuration, getDurationOptions, getTimeOptions } from '../room-search/searchParams';
import { buildOfficeInterval } from '../../lib/time';
import { BookingSuccessNotice, type BookingSuccess } from './BookingSuccessNotice';
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
  onSuccess?: (booking: BookingSuccess) => void;
}) {
  const [success, setSuccess] = useState<BookingSuccess>();
  const [conflict, setConflict] = useState(false);
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
    } catch (error) {
      if (error instanceof ApiError && error.code === 'BOOKING_CONFLICT') setConflict(true);
      return;
    }
    const completedBooking = {
      roomName: selection.room.name,
      date: values.date,
      startTime: values.startTime,
      durationMinutes: values.durationMinutes,
      timezone: selection.room.office.timezone,
    };
    setSuccess(completedBooking);
    onSuccess?.(completedBooking);
    onOpenChange(false);
  };
  const durationOptions = getDurationOptions(form.watch('startTime'));
  if (success)
    return <BookingSuccessNotice booking={success} onDismiss={() => setSuccess(undefined)} />;
  if (conflict) {
    return (
      <Dialog open={open} title="Время уже занято" onOpenChange={onOpenChange} showClose={false}>
        <div className={styles.conflict}>
          <span className={styles.conflictIcon} aria-hidden="true">
            !
          </span>
          <p>Выбранный интервал был забронирован другим сотрудником. Расписание обновлено.</p>
          <Button
            type="button"
            onClick={() => {
              setConflict(false);
              mutation.reset();
            }}
          >
            Выбрать другое время
          </Button>
        </div>
      </Dialog>
    );
  }
  const mutationError = mutation.error;
  return (
    <Dialog open={open} title="Новое бронирование" onOpenChange={onOpenChange} showClose={false}>
      <p className={styles.roomMeta}>
        Переговорная: <strong>{selection.room.name}</strong> ({selection.room.office.name},{' '}
        {selection.room.floor} этаж)
      </p>
      {mutationError ? (
        <Alert variant="error">
          {mutationError instanceof ApiError
            ? mutationError.message
            : 'Не удалось создать бронирование'}
        </Alert>
      ) : null}
      <form className={styles.form} onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <label className={form.formState.errors.title ? styles.invalid : undefined}>
          Тема встречи <span aria-hidden="true">*</span>
          <input
            {...form.register('title')}
            placeholder="Укажите тему встречи"
            aria-invalid={Boolean(form.formState.errors.title)}
            aria-describedby={form.formState.errors.title ? 'booking-title-error' : undefined}
          />
        </label>
        {form.formState.errors.title ? (
          <span id="booking-title-error" className={styles.error}>
            {form.formState.errors.title.message}
          </span>
        ) : null}
        <div className={styles.intervalFields}>
          <DatePicker
            label="Дата"
            value={form.watch('date')}
            onValueChange={(date) => form.setValue('date', date, { shouldValidate: true })}
          />
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
        </div>
        <Select
          label="Продолжительность"
          value={String(form.watch('durationMinutes'))}
          onValueChange={(durationMinutes) =>
            form.setValue('durationMinutes', Number(durationMinutes), { shouldValidate: true })
          }
          options={durationOptions.map((minutes) => ({
            value: String(minutes),
            label: formatDuration(minutes),
          }))}
        />
        {form.formState.errors.startTime ? (
          <span className={styles.error}>{form.formState.errors.startTime.message}</span>
        ) : null}
        <label>
          Комментарий
          <textarea
            placeholder="Дополнительная информация для участников встречи…"
            {...form.register('comment')}
          />
        </label>
        <p className={styles.summary}>
          ⓘ Бронирование на {form.watch('date')}, {form.watch('startTime')} —{' '}
          {formatDuration(Number(form.watch('durationMinutes')))}
        </p>
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
