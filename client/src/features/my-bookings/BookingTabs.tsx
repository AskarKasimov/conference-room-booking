import { Link } from '@tanstack/react-router';
import styles from './MyBookings.module.scss';

export function BookingTabs({
  scope,
  officeId,
}: {
  scope: 'upcoming' | 'past';
  officeId?: string;
}) {
  return (
    <nav aria-label="Фильтр бронирований" className={styles.tabs}>
      <Link
        to="/bookings"
        search={{ scope: 'upcoming', officeId }}
        data-active={scope === 'upcoming'}
      >
        Предстоящие
      </Link>
      <Link to="/bookings" search={{ scope: 'past', officeId }} data-active={scope === 'past'}>
        Прошедшие
      </Link>
    </nav>
  );
}
