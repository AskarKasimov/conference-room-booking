import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import type { RoomSummary } from '../../../entities/room';
import { ApiError } from '../../../shared/api';
import { Button } from '../../../shared/ui';
import { Dialog } from '../../../shared/ui';
import { Alert } from '../../../shared/ui';
import { DatePicker } from '../../../shared/ui';
import { Select } from '../../../shared/ui';
import {
  formatDuration,
  getBookableDateBounds,
  getBookableTimeOptions,
  getDurationOptions,
} from '../../../entities/booking';
import { buildOfficeInterval } from '../../../shared/lib';
import { BookingSuccessNotice, type BookingSuccess } from './BookingSuccessNotice';
import { createBookingSchema, type BookingFormValues } from '../model/bookingSchema';
import { useCreateBookingMutation } from '../model/useCreateBookingMutation';
import { useQueryClient } from '@tanstack/react-query';
import ClockIcon from '../../../shared/assets/icons/clock.svg?react';
import { scheduleQueryKeys } from '../../../entities/booking';
import { roomQueryKeys } from '../../../entities/room';
import { useClock } from '../../../shared/lib';
import AlertTriangleIcon from '../../../shared/assets/icons/alert-triangle.svg?react';
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
  onCloseComplete,
}: {
  selection: BookingSelection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (booking: BookingSuccess) => void;
  onCloseComplete?: () => void;
}) {
  const now = useClock();
  const [success, setSuccess] = useState<BookingSuccess>();
  const [conflict, setConflict] = useState(false);
  const [refreshSucceeded, setRefreshSucceeded] = useState<boolean>();
  const [refreshTargets, setRefreshTargets] = useState('');
  const queryClient = useQueryClient();
  const mutation = useCreateBookingMutation();
  const schema = createBookingSchema({ timezone: selection.room.office.timezone, now });
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
  const resetForm = form.reset;
  const triggerValidation = form.trigger;
  const resetMutation = mutation.reset;
  useEffect(() => {
    if (open && form.formState.isSubmitted)
      void triggerValidation(['date', 'startTime', 'durationMinutes']);
  }, [form.formState.isSubmitted, now, open, triggerValidation]);
  useEffect(() => {
    if (!open) return;
    resetForm({
      title: '',
      comment: '',
      date: selection.date,
      startTime: selection.startTime,
      durationMinutes: selection.durationMinutes,
    });
    setSuccess(undefined);
    setConflict(false);
    setRefreshSucceeded(undefined);
    setRefreshTargets('');
    resetMutation();
  }, [
    open,
    selection.room.id,
    selection.date,
    selection.startTime,
    selection.durationMinutes,
    resetForm,
    resetMutation,
  ]);
  const onSubmit = async (values: BookingFormValues) => {
    const interval = buildOfficeInterval({
      ...values,
      timezone: selection.room.office.timezone,
      now: new Date(),
    });
    try {
      await mutation.mutateAsync({
        roomId: selection.room.id,
        title: values.title,
        comment: values.comment?.trim() || null,
        startsAt: interval.from,
        endsAt: interval.to,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'BOOKING_CONFLICT') {
        setConflict(true);
        const hasSchedule =
          queryClient.getQueryCache().findAll({ queryKey: scheduleQueryKeys.all, type: 'active' })
            .length > 0;
        const hasAvailability =
          queryClient.getQueryCache().findAll({ queryKey: roomQueryKeys.all, type: 'active' })
            .length > 0;
        const refreshes = [
          hasSchedule
            ? queryClient.refetchQueries(
                { queryKey: scheduleQueryKeys.all, type: 'active' },
                { throwOnError: true },
              )
            : undefined,
          hasAvailability
            ? queryClient.refetchQueries(
                { queryKey: roomQueryKeys.all, type: 'active' },
                { throwOnError: true },
              )
            : undefined,
        ].filter((refresh): refresh is Promise<void> => Boolean(refresh));
        const refreshResults = await Promise.allSettled(refreshes);
        setRefreshTargets(
          hasSchedule && hasAvailability
            ? 'Расписание и доступность обновлены.'
            : hasSchedule
              ? 'Расписание обновлено.'
              : hasAvailability
                ? 'Доступность обновлена.'
                : '',
        );
        setRefreshSucceeded(
          refreshes.length > 0 && refreshResults.every((result) => result.status === 'fulfilled'),
        );
      }
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
  const focusFirstInvalidField = (errors: typeof form.formState.errors) => {
    const fields = ['title', 'date', 'startTime', 'durationMinutes', 'comment'] as const;
    const fieldIds: Record<(typeof fields)[number], string> = {
      title: 'booking-title',
      date: 'booking-date',
      startTime: 'booking-start-time',
      durationMinutes: 'booking-duration',
      comment: 'booking-comment',
    };
    const field = fields.find((key) => errors[key] !== undefined);
    const fieldId = field ? fieldIds[field] : undefined;
    if (fieldId) document.getElementById(fieldId)?.focus();
  };
  const selectedDate = form.watch('date');
  const selectedStartTime = form.watch('startTime');
  const selectedDuration = Number(form.watch('durationMinutes'));
  const summaryStart = DateTime.fromISO(`${selectedDate}T${selectedStartTime}`, {
    zone: selection.room.office.timezone,
  }).setLocale('ru');
  const summaryEnd = summaryStart.plus({ minutes: selectedDuration });
  const dateLabel = summaryStart.toFormat('cccc, d MMMM');
  const formattedDateLabel = `${dateLabel.slice(0, 1).toUpperCase()}${dateLabel.slice(1)}`;
  const capitalizedDateLabel = formattedDateLabel.replace(
    / ([^ ]+)$/,
    (_, month: string) => ` ${month.slice(0, 1).toUpperCase()}${month.slice(1)}`,
  );
  const availableTimes = getBookableTimeOptions(selectedDate, selection.room.office.timezone, now);
  const dateBounds = getBookableDateBounds(selection.room.office.timezone, now);
  const durationOptions = getDurationOptions(form.watch('startTime'));
  const successNotice =
    success && !onSuccess ? (
      <BookingSuccessNotice booking={success} onDismiss={() => setSuccess(undefined)} />
    ) : null;
  if (conflict) {
    return (
      <>
        <Dialog
          open={open}
          title="Время уже занято"
          size="compact"
          layout="centered"
          onOpenChange={onOpenChange}
          {...(onCloseComplete ? { onCloseComplete } : {})}
          showClose={false}
        >
          <div className={styles.conflict}>
            <span className={styles.conflictIcon} aria-hidden="true">
              <AlertTriangleIcon />
            </span>
            <p>
              Выбранный интервал был забронирован другим сотрудником.{' '}
              {refreshSucceeded === undefined
                ? 'Проверяем актуальное расписание…'
                : refreshSucceeded
                  ? refreshTargets
                  : 'Не удалось обновить расписание и доступность. Попробуйте обновить данные вручную.'}
            </p>
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
        {successNotice}
      </>
    );
  }
  const mutationError = mutation.error;
  return (
    <>
      <Dialog
        open={open}
        title="Новое бронирование"
        size="wide"
        onOpenChange={onOpenChange}
        {...(onCloseComplete ? { onCloseComplete } : {})}
        showClose={false}
      >
        <p className={styles.roomMeta}>
          Переговорная: <strong>{selection.room.name}</strong> ({selection.room.office.name},{' '}
          {selection.room.floor} этаж)
        </p>
        <hr className={styles.formDivider} />
        {mutationError ? (
          <Alert variant="error">
            {mutationError instanceof ApiError
              ? mutationError.message
              : 'Не удалось создать бронирование'}
          </Alert>
        ) : null}
        <form
          className={styles.form}
          onSubmit={(event) => void form.handleSubmit(onSubmit, focusFirstInvalidField)(event)}
        >
          <label className={form.formState.errors.title ? styles.invalid : undefined}>
            <span>
              Тема встречи <span aria-hidden="true">*</span>
            </span>
            <input
              id="booking-title"
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
            <div>
              <DatePicker
                label="Дата"
                id="booking-date"
                value={selectedDate}
                min={dateBounds.min}
                max={dateBounds.max}
                ariaInvalid={Boolean(form.formState.errors.date)}
                ariaDescribedBy={form.formState.errors.date ? 'booking-date-error' : undefined}
                onValueChange={(date) => {
                  form.setValue('date', date, { shouldValidate: true });
                  const nextTime = getBookableTimeOptions(
                    date,
                    selection.room.office.timezone,
                    now,
                  )[0];
                  if (nextTime) {
                    form.setValue('startTime', nextTime, { shouldValidate: true });
                    const nextDurations = getDurationOptions(nextTime);
                    if (!nextDurations.includes(Number(form.getValues('durationMinutes'))))
                      form.setValue('durationMinutes', nextDurations.at(-1) ?? 15, {
                        shouldValidate: true,
                      });
                  }
                }}
              />
              {form.formState.errors.date ? (
                <span id="booking-date-error" className={styles.error}>
                  {form.formState.errors.date.message}
                </span>
              ) : null}
            </div>
            <div>
              <Select
                label="Время начала"
                leadingIcon={ClockIcon}
                id="booking-start-time"
                ariaInvalid={Boolean(form.formState.errors.startTime)}
                ariaDescribedBy={
                  form.formState.errors.startTime ? 'booking-start-time-error' : undefined
                }
                value={form.watch('startTime')}
                onValueChange={(startTime) => {
                  const nextDurationOptions = getDurationOptions(startTime);
                  form.setValue('startTime', startTime, { shouldValidate: true });
                  if (!nextDurationOptions.includes(Number(form.getValues('durationMinutes'))))
                    form.setValue('durationMinutes', nextDurationOptions.at(-1) ?? 15, {
                      shouldValidate: true,
                    });
                }}
                options={availableTimes.map((time) => ({ value: time, label: time }))}
              />
              {form.formState.errors.startTime ? (
                <span id="booking-start-time-error" className={styles.error}>
                  {form.formState.errors.startTime.message}
                </span>
              ) : null}
            </div>
          </div>
          <Select
            label="Продолжительность"
            id="booking-duration"
            ariaInvalid={Boolean(form.formState.errors.durationMinutes)}
            ariaDescribedBy={
              form.formState.errors.durationMinutes ? 'booking-duration-error' : undefined
            }
            value={String(form.watch('durationMinutes'))}
            onValueChange={(durationMinutes) =>
              form.setValue('durationMinutes', Number(durationMinutes), { shouldValidate: true })
            }
            options={durationOptions.map((minutes) => ({
              value: String(minutes),
              label: `${formatDuration(minutes)} (до ${DateTime.fromISO(
                `${form.watch('date')}T${form.watch('startTime')}`,
                { zone: selection.room.office.timezone },
              )
                .plus({ minutes })
                .toFormat('HH:mm')})`,
            }))}
          />
          {form.formState.errors.durationMinutes ? (
            <span id="booking-duration-error" className={styles.error}>
              {form.formState.errors.durationMinutes.message}
            </span>
          ) : null}
          <label>
            Комментарий
            <textarea
              id="booking-comment"
              placeholder="Дополнительная информация для участников встречи…"
              {...form.register('comment')}
              aria-invalid={Boolean(form.formState.errors.comment)}
              aria-describedby={form.formState.errors.comment ? 'booking-comment-error' : undefined}
            />
          </label>
          {form.formState.errors.comment ? (
            <span id="booking-comment-error" className={styles.error}>
              {form.formState.errors.comment.message}
            </span>
          ) : null}
          <p className={styles.summary}>
            ⓘ Бронирование на {capitalizedDateLabel}, {selectedStartTime} –{' '}
            {summaryEnd.toFormat('HH:mm')} ({formatDuration(selectedDuration)})
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
      {successNotice}
    </>
  );
}
