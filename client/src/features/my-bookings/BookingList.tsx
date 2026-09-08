import type { BookingView } from '../../api/contracts';
import { BookingRow } from './BookingRow';
import styles from './MyBookings.module.scss';

export function BookingList({
  bookings,
  canCancel,
}: {
  bookings: BookingView[];
  canCancel: boolean;
}) {
  return (
    <div className={styles.list}>
      {[...bookings]
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((booking) => (
          <BookingRow key={booking.id} booking={booking} canCancel={canCancel} />
        ))}
    </div>
  );
}
