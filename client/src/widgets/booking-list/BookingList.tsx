import type { BookingView } from '../../entities/booking';
import { BookingRow } from './BookingRow';
import styles from './BookingList.module.scss';

export function BookingList({
  bookings,
  canCancel,
  currentUserId,
  scope,
}: {
  bookings: BookingView[];
  canCancel: boolean;
  currentUserId?: string | undefined;
  scope: 'upcoming' | 'past' | 'all';
}) {
  return (
    <div className={styles.list}>
      {[...bookings]
        .sort((a, b) => {
          const order = Date.parse(a.startsAt) - Date.parse(b.startsAt);
          return scope === 'past' ? -order : order;
        })
        .map((booking) => (
          <BookingRow
            key={booking.id}
            booking={booking}
            canCancel={canCancel}
            currentUserId={currentUserId}
          />
        ))}
    </div>
  );
}
