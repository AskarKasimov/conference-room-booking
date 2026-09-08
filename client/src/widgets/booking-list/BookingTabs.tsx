import { Link } from 'react-router-dom';
import { useSlidingIndicator } from '../../shared/lib';
import styles from './BookingList.module.scss';

export function BookingTabs({
  scope,
  officeId,
  count,
}: {
  scope: 'upcoming' | 'past' | 'all';
  officeId?: string | undefined;
  count: number | undefined;
}) {
  const { containerRef, indicatorStyle, ready } = useSlidingIndicator(
    scope,
    '[data-active="true"]',
  );

  return (
    <nav ref={containerRef} aria-label="Фильтр бронирований" className={styles.tabs}>
      <Link
        to={`/bookings?scope=upcoming${officeId ? `&officeId=${encodeURIComponent(officeId)}` : ''}`}
        data-active={scope === 'upcoming'}
      >
        Предстоящие{scope === 'upcoming' && count !== undefined ? ` (${count})` : ''}
      </Link>
      <Link
        to={`/bookings?scope=past${officeId ? `&officeId=${encodeURIComponent(officeId)}` : ''}`}
        data-active={scope === 'past'}
      >
        Прошедшие{scope === 'past' && count !== undefined ? ` (${count})` : ''}
      </Link>
      <span
        aria-hidden="true"
        className={styles.indicator}
        data-ready={ready}
        style={indicatorStyle}
      />
    </nav>
  );
}
