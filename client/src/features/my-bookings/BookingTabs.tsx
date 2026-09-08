import { Link } from '@tanstack/react-router';
import styles from './MyBookings.module.scss';

export function BookingTabs({
  scope,
  officeId,
  count,
}: {
  scope: 'upcoming' | 'past' | 'all';
  officeId?: string;
  count: number;
}) {
  return (
    <nav aria-label="Фильтр бронирований" className={styles.tabs}>
      <Link
        to="/bookings"
        search={{ scope: 'upcoming', officeId }}
        data-active={scope === 'upcoming'}
      >
        Предстоящие{scope === 'upcoming' ? ` (${count})` : ''}
      </Link>
      <Link to="/bookings" search={{ scope: 'past', officeId }} data-active={scope === 'past'}>
        Прошедшие{scope === 'past' ? ` (${count})` : ''}
      </Link>
    </nav>
  );
}
