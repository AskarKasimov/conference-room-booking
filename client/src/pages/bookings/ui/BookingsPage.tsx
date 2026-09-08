import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui';
import { ErrorState } from '../../../shared/ui';
import { PageSkeleton } from '../../../shared/ui';
import { useBookingsQuery } from '../../../entities/booking';
import { useOfficesQuery } from '../../../entities/office';
import { useCurrentUserQuery } from '../../../entities/user';
import { BookingList, BookingTabs, BookingsFilters } from '../../../widgets/booking-list';
import styles from './BookingsPage.module.scss';

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
  const currentUser = useCurrentUserQuery();
  const bookings = useBookingsQuery({
    scope: search.scope,
    ...(search.officeId !== undefined ? { officeId: search.officeId } : {}),
  });

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
        <BookingTabs
          scope={search.scope}
          officeId={search.officeId}
          count={bookings.isPlaceholderData ? undefined : items.length}
        />
        {bookings.isPlaceholderData ? (
          <PageSkeleton label="Загрузка бронирований…" />
        ) : items.length ? (
          <BookingList
            bookings={items}
            canCancel={search.scope === 'upcoming'}
            currentUserId={currentUser.data?.id}
            scope={search.scope}
          />
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
