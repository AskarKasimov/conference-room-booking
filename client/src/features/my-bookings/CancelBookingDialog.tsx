import { DateTime } from 'luxon';
import CalendarIcon from '../../assets/icons/calendar.svg?react';
import RoomIcon from '../../assets/icons/room.svg?react';
import { useCancelBookingMutation } from './useCancelBookingMutation';
import type { BookingView } from '../../api/contracts';
import { ApiError } from '../../api/client';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { formatLocalTime } from '../../lib/time';
import styles from './MyBookings.module.scss';

function formatBookingDate(value: string, timezone: string): string {
  const date = DateTime.fromISO(value, { setZone: true }).setZone(timezone).setLocale('ru');
  const label = date.toFormat('cccc, d MMMM');
  return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
}

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useCancelBookingMutation();
  const confirm = async () => {
    try {
      await mutation.mutateAsync(booking.id);
      onOpenChange(false);
    } catch {
      return;
    }
  };
  return (
    <Dialog
      open={open}
      title="Отменить бронирование?"
      onOpenChange={onOpenChange}
      showClose={false}
    >
      <p className={styles.confirmation}>
        Это действие нельзя будет отменить. Освободившееся время станет доступно другим сотрудникам.
      </p>
      <div className={styles.bookingDetails}>
        <strong>{booking.title}</strong>
        <p>
          <RoomIcon aria-hidden="true" />
          Комната «{booking.room.name}», {booking.room.floor} этаж
        </p>
        <p>
          <CalendarIcon aria-hidden="true" />
          {formatBookingDate(booking.startsAt, booking.office.timezone)},{' '}
          {formatLocalTime(booking.startsAt, booking.office.timezone)} –{' '}
          {formatLocalTime(booking.endsAt, booking.office.timezone)}
        </p>
      </div>
      {mutation.error ? (
        <Alert variant="error">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : 'Не удалось отменить бронирование'}
        </Alert>
      ) : null}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
        >
          Нет, оставить
        </Button>
        <Button variant="danger" onClick={() => void confirm()} isLoading={mutation.isPending}>
          Да, отменить
        </Button>
      </div>
    </Dialog>
  );
}
