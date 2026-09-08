import { useState } from 'react';
import { DateTime } from 'luxon';
import type { BookingView } from '../../api/contracts';
import { Button } from '../../components/ui/Button';
import OfficeIcon from '../../assets/icons/office.svg?react';
import { formatLocalTime } from '../../lib/time';
import { CancelBookingDialog } from './CancelBookingDialog';
import { useClock } from '../../hooks/useClock';
import styles from './MyBookings.module.scss';

export function BookingRow({
  booking,
  canCancel,
  currentUserId,
}: {
  booking: BookingView;
  canCancel: boolean;
  currentUserId?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const now = useClock(Date.parse(booking.startsAt));
  const canCancelThisBooking =
    canCancel && booking.userId === currentUserId && Date.parse(booking.startsAt) > now.getTime();
  const localDate = DateTime.fromISO(booking.startsAt, { setZone: true })
    .setZone(booking.office.timezone)
    .setLocale('ru');
  return (
    <article className={styles.row}>
      <div className={styles.date}>
        <span>{localDate.toFormat('LLLL').toUpperCase()}</span>
        <strong>{localDate.toFormat('d')}</strong>
      </div>
      <div className={styles.bookingInfo}>
        <h2>{booking.title}</h2>
        <p className={styles.metadata}>
          <OfficeIcon aria-hidden="true" />
          <span className={styles.roomName}>{booking.room.name}</span>
          <span className={styles.metadataSeparator} aria-hidden="true">
            •
          </span>
          <span className={styles.metadataItem}>{booking.room.floor} этаж</span>
          <span className={styles.metadataSeparator} aria-hidden="true">
            •
          </span>
          <span className={styles.metadataItem}>
            {formatLocalTime(booking.startsAt, booking.office.timezone)}–
            {formatLocalTime(booking.endsAt, booking.office.timezone)} ({booking.office.timezone})
          </span>
        </p>
      </div>
      {canCancelThisBooking ? (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Отменить
        </Button>
      ) : null}
      <CancelBookingDialog booking={booking} open={open} onOpenChange={setOpen} />
    </article>
  );
}
