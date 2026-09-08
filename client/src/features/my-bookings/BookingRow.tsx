import { useState } from 'react';
import { DateTime } from 'luxon';
import type { BookingView } from '../../api/contracts';
import { Button } from '../../components/ui/Button';
import { formatLocalTime } from '../../lib/time';
import { CancelBookingDialog } from './CancelBookingDialog';
import styles from './MyBookings.module.scss';

export function BookingRow({ booking, canCancel }: { booking: BookingView; canCancel: boolean }) {
  const [open, setOpen] = useState(false);
  const localDate = DateTime.fromISO(booking.startsAt, { setZone: true })
    .setZone(booking.office.timezone)
    .setLocale('ru');
  return (
    <article className={styles.row}>
      <div className={styles.date}>
        <span>{localDate.toFormat('LLLL').toUpperCase()}</span>
        <strong>{localDate.toFormat('d')}</strong>
      </div>
      <div>
        <h2>{booking.title}</h2>
        <p>
          <span aria-hidden="true">⌂</span> {booking.room.name} · {booking.room.floor} этаж ·{' '}
          {formatLocalTime(booking.startsAt, booking.office.timezone)}–
          {formatLocalTime(booking.endsAt, booking.office.timezone)} МСК
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
