import { Link } from 'react-router-dom';
import { useSlidingIndicator } from '../../shared/lib';
import styles from './BookingList.module.scss';

export function BookingTabs({
  scope,
  officeId,
  period,
  count,
}: {
  scope: 'upcoming' | 'past' | 'all';
  officeId?: string | undefined;
  period?: string | undefined;
  count: number | undefined;
}) {
  const { containerRef, indicatorStyle, ready } = useSlidingIndicator(
    scope,
    '[data-active="true"]',
  );
  const query = (nextScope: string) => {
    const params = new URLSearchParams({ scope: nextScope });
    if (officeId) params.set('officeId', officeId);
    if (period && period !== 'all') params.set('period', period);
    return `/bookings?${params.toString()}`;
  };

  return (
    <nav ref={containerRef} aria-label="Фильтр бронирований" className={styles.tabs}>
      <Link to={query('upcoming')} data-active={scope === 'upcoming'}>
        Предстоящие{scope === 'upcoming' && count !== undefined ? ` (${count})` : ''}
      </Link>
      <Link to={query('past')} data-active={scope === 'past'}>
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
