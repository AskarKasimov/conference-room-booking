import { Link } from '@tanstack/react-router';
import styles from './MyBookings.module.scss';

export function BookingTabs({
  scope,
  officeId,
}: {
  scope: 'upcoming' | 'past' | 'all';
  officeId?: string;
}) {
  return (
    <nav aria-label="Фильтр бронирований" className={styles.tabs}>
      <Link
        to="/bookings"
        search={{ scope: 'upcoming', officeId }}
        data-active={scope === 'upcoming'}
      >
        Предстоящие{scope === 'upcoming' ? '' : null}
      </Link>
      <Link to="/bookings" search={{ scope: 'past', officeId }} data-active={scope === 'past'}>
        Прошедшие
      </Link>
    </nav>
  );
}
