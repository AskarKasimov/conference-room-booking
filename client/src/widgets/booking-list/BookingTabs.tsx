import { Link } from 'react-router-dom';
import styles from './BookingList.module.scss';

export function BookingTabs({
  scope,
  officeId,
  count,
}: {
  scope: 'upcoming' | 'past' | 'all';
  officeId?: string | undefined;
  count: number;
}) {
  return (
    <nav aria-label="Фильтр бронирований" className={styles.tabs}>
      <Link
        to={`/bookings?scope=upcoming${officeId ? `&officeId=${encodeURIComponent(officeId)}` : ''}`}
        data-active={scope === 'upcoming'}
      >
        Предстоящие{scope === 'upcoming' ? ` (${count})` : ''}
      </Link>
      <Link
        to={`/bookings?scope=past${officeId ? `&officeId=${encodeURIComponent(officeId)}` : ''}`}
        data-active={scope === 'past'}
      >
        Прошедшие{scope === 'past' ? ` (${count})` : ''}
      </Link>
    </nav>
  );
}
