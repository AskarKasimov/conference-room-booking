import { useCancelBookingMutation } from './useCancelBookingMutation';
import type { BookingView } from '../../api/contracts';
import { ApiError } from '../../api/client';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { formatLocalDate, formatLocalTime } from '../../lib/time';
import styles from './MyBookings.module.scss';

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
    <Dialog open={open} title="Отменить бронирование" onOpenChange={onOpenChange}>
      <p>
        {booking.room.name}, {formatLocalDate(booking.startsAt, booking.office.timezone)}{' '}
        {formatLocalTime(booking.startsAt, booking.office.timezone)}–
        {formatLocalTime(booking.endsAt, booking.office.timezone)}
      </p>
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
          Оставить
        </Button>
        <Button variant="danger" onClick={() => void confirm()} isLoading={mutation.isPending}>
          Отменить бронирование
        </Button>
      </div>
    </Dialog>
  );
}
