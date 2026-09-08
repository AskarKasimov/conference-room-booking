import { useState } from 'react';
import type { BookingView } from '../../api/contracts';
import { Button } from '../../components/ui/Button';
import { formatLocalDate, formatLocalTime } from '../../lib/time';
import { CancelBookingDialog } from './CancelBookingDialog';
import styles from './MyBookings.module.scss';

export function BookingRow({ booking, canCancel }: { booking: BookingView; canCancel: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={styles.row}>
      <div className={styles.date}>
        <strong>{formatLocalDate(booking.startsAt, booking.office.timezone)}</strong>
        <span>
          {formatLocalTime(booking.startsAt, booking.office.timezone)}–
          {formatLocalTime(booking.endsAt, booking.office.timezone)}
        </span>
      </div>
      <div>
        <h2>{booking.title}</h2>
        <p>
          {booking.room.name} · {booking.office.name} · {booking.room.floor} этаж
        </p>
      </div>
      {canCancel ? (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Отменить
        </Button>
      ) : null}
      <CancelBookingDialog booking={booking} open={open} onOpenChange={setOpen} />
    </article>
  );
}
