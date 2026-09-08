import { Link, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Button, DelayedContent, PageState } from '../../../shared/ui';
import { useBookingsQuery } from '../../../entities/booking';
import { useOfficesQuery } from '../../../entities/office';
import { useCurrentUserQuery } from '../../../entities/user';
import { BookingList, BookingTabs, BookingsFilters } from '../../../widgets/booking-list';
import AlertTriangleIcon from '../../../shared/assets/icons/alert-triangle.svg?react';
import CalendarPlusIcon from '../../../shared/assets/icons/calendar-plus.svg?react';
import styles from './BookingsPage.module.scss';

export function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scopeValue = searchParams.get('scope');
  const periodValue = searchParams.get('period');
  const period = periodValue === '30d' || periodValue === '90d' ? periodValue : 'all';
  const scope: 'upcoming' | 'past' | 'all' =
    scopeValue === 'past' || scopeValue === 'all' ? scopeValue : 'upcoming';
  const search = {
    scope,
    officeId: searchParams.get('officeId') ?? undefined,
  };
  const offices = useOfficesQuery();
  const currentUser = useCurrentUserQuery();
  const bookings = useBookingsQuery({
    scope: search.scope,
    ...(search.officeId !== undefined ? { officeId: search.officeId } : {}),
  });

  const rawItems = bookings.data ?? [];
  const items =
    period === 'all'
      ? rawItems
      : rawItems.filter((booking) => {
          const days = period === '30d' ? 30 : 90;
          const cutoff = DateTime.now().minus({ days }).toMillis();
          return DateTime.fromISO(booking.startsAt, { setZone: true }).toMillis() >= cutoff;
        });
  const loading = offices.isLoading || bookings.isLoading || bookings.isPlaceholderData;
  const error = offices.isError || bookings.isError;

  function updateFilters(next: { officeId?: string | undefined; period?: string | undefined }) {
    const params = new URLSearchParams();
    params.set('scope', search.scope);
    const officeId = 'officeId' in next ? next.officeId : search.officeId;
    const nextPeriod = next.period ?? period;
    if (officeId) params.set('officeId', officeId);
    if (nextPeriod !== 'all') params.set('period', nextPeriod);
    setSearchParams(params);
  }

  let content: React.ReactNode;
  let fallback: React.ReactNode;
  if (loading) {
    fallback = (
      <div className={styles.skeletonList} role="status" aria-label="Загрузка бронирований…">
        {[0, 1].map((row) => (
          <div className={styles.bookingSkeleton} data-booking-skeleton key={row}>
            <div className={styles.dateSkeleton} data-date-skeleton aria-hidden="true">
              <i />
              <i />
            </div>
            <div className={styles.bookingInfoSkeleton} aria-hidden="true">
              <i />
              <div className={styles.metadataSkeleton} data-metadata-skeleton>
                <i />
                <span>•</span>
                <i />
                <span>•</span>
                <i />
              </div>
            </div>
            <i className={styles.bookingActionSkeleton} aria-hidden="true" />
          </div>
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <PageState
        className={styles.bookingsError}
        variant="error"
        icon={<AlertTriangleIcon />}
        title="Не удалось загрузить данные"
        description="Произошла ошибка при загрузке ваших бронирований"
        action={
          <Button
            onClick={() => {
              void offices.refetch();
              void bookings.refetch();
            }}
          >
            Попробовать снова
          </Button>
        }
      />
    );
  } else if (items.length) {
    content = (
      <BookingList
        bookings={items}
        canCancel={search.scope === 'upcoming'}
        currentUserId={currentUser.data?.id}
        scope={search.scope}
      />
    );
  } else {
    content = (
      <PageState
        className={styles.bookingsEmpty}
        variant="empty"
        icon={<CalendarPlusIcon />}
        title="Нет бронирований"
        description={
          <>
            У вас пока нет предстоящих бронирований.
            <br />
            Перейдите в раздел переговорных, чтобы забронировать комнату.
          </>
        }
        action={<Link to="/rooms">Перейти к переговорным</Link>}
      />
    );
  }

  return (
    <div className={styles.page}>
      {offices.isLoading ? (
        <DelayedContent
          pending
          fallback={
            <div className={styles.pageHeader} aria-hidden="true">
              <div className={styles.headerTitleSkeleton} />
              <div className={styles.headerFiltersSkeleton}>
                <i />
                <i />
              </div>
            </div>
          }
        />
      ) : (
        <div className={styles.pageHeader}>
          <h1>Мои бронирования</h1>
          <div className={styles.toolbar}>
            <BookingsFilters
              offices={offices.data ?? []}
              value={search.officeId}
              period={period}
              onChange={(officeId) => updateFilters({ officeId })}
              onPeriodChange={(nextPeriod) => updateFilters({ period: nextPeriod })}
            />
          </div>
        </div>
      )}
      {offices.isLoading ? (
        <DelayedContent
          pending
          fallback={
            <div className={styles.tabsSkeleton} aria-hidden="true">
              <i />
              <i />
            </div>
          }
        />
      ) : (
        <BookingTabs
          scope={search.scope}
          officeId={search.officeId}
          period={period}
          count={
            bookings.data === undefined || bookings.isPlaceholderData ? undefined : items.length
          }
        />
      )}
      <section className={styles.stateRegion}>
        <DelayedContent pending={loading} fallback={fallback}>
          {content}
        </DelayedContent>
      </section>
    </div>
  );
}
