import { useSearchParams } from 'react-router-dom';
import { BookingList } from '../features/my-bookings/BookingList';
import { BookingTabs } from '../features/my-bookings/BookingTabs';
import { BookingsFilters } from '../features/my-bookings/BookingsFilters';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { useBookingsQuery } from '../hooks/useBookingsQuery';
import { useOfficesQuery } from '../hooks/useOfficesQuery';
import styles from '../features/my-bookings/MyBookings.module.scss';

export function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scopeValue = searchParams.get('scope');
  const scope: 'upcoming' | 'past' | 'all' =
    scopeValue === 'past' || scopeValue === 'all' ? scopeValue : 'upcoming';
  const search = {
    scope,
    officeId: searchParams.get('officeId') ?? undefined,
  };
  const offices = useOfficesQuery();
  const bookings = useBookingsQuery({ scope: search.scope, officeId: search.officeId });

  let content: React.ReactNode;
  if (offices.isLoading || bookings.isLoading) {
    content = <PageSkeleton label="Загрузка бронирований…" />;
  } else if (offices.isError || bookings.isError) {
    content = (
      <ErrorState
        title="Не удалось загрузить бронирования"
        description="Попробуйте повторить запрос."
        onRetry={() => {
          void offices.refetch();
          void bookings.refetch();
        }}
      />
    );
  } else {
    const items = bookings.data ?? [];

    content = (
      <>
        <div className={styles.pageHeader}>
          <h1>Мои бронирования</h1>
          <div className={styles.toolbar}>
            <BookingsFilters
              offices={offices.data ?? []}
              value={search.officeId}
              onChange={(officeId) => {
                const params = new URLSearchParams();
                params.set('scope', search.scope);
                if (officeId) params.set('officeId', officeId);
                setSearchParams(params);
              }}
            />
          </div>
        </div>
        <BookingTabs scope={search.scope} officeId={search.officeId} count={items.length} />
        {items.length ? (
          <BookingList bookings={items} canCancel={search.scope === 'upcoming'} />
        ) : (
          <EmptyState
            title={
              search.scope === 'upcoming'
                ? 'Нет предстоящих бронирований'
                : search.scope === 'past'
                  ? 'Нет прошедших бронирований'
                  : 'Нет бронирований'
            }
            description="Здесь появятся ваши бронирования. Перейдите в раздел переговорных, чтобы забронировать комнату."
          />
        )}
      </>
    );
  }

  return <div className={styles.page}>{content}</div>;
}
