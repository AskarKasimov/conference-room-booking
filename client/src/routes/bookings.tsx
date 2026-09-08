import { createFileRoute } from '@tanstack/react-router';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { BookingList } from '../features/my-bookings/BookingList';
import { BookingTabs } from '../features/my-bookings/BookingTabs';
import { BookingsFilters } from '../features/my-bookings/BookingsFilters';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { useBookingsQuery } from '../hooks/useBookingsQuery';
import { useOfficesQuery } from '../hooks/useOfficesQuery';
import styles from '../features/my-bookings/MyBookings.module.scss';

export const Route = createFileRoute('/bookings')({
  validateSearch: (search: Record<string, unknown>) => ({
    scope: search.scope === 'past' ? ('past' as const) : ('upcoming' as const),
    officeId: typeof search.officeId === 'string' ? search.officeId : undefined,
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const search = useSearch({ from: '/bookings' });
  const navigate = useNavigate({ from: '/bookings' });
  const offices = useOfficesQuery();
  const bookings = useBookingsQuery({ scope: search.scope, officeId: search.officeId });

  if (offices.isLoading || bookings.isLoading)
    return <PageSkeleton label="Загрузка бронирований…" />;

  if (offices.isError || bookings.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить бронирования"
        description="Попробуйте повторить запрос."
        onRetry={() => {
          void offices.refetch();
          void bookings.refetch();
        }}
      />
    );
  }

  const items = bookings.data ?? [];

  return (
    <div className={styles.page}>
      <h1>Мои бронирования</h1>
      <BookingTabs scope={search.scope} officeId={search.officeId} />
      <div className={styles.toolbar}>
        <BookingsFilters
          offices={offices.data ?? []}
          value={search.officeId}
          onChange={(officeId) => void navigate({ search: { scope: search.scope, officeId } })}
        />
      </div>
      {items.length ? (
        <BookingList bookings={items} canCancel={search.scope === 'upcoming'} />
      ) : (
        <EmptyState
          title={
            search.scope === 'upcoming'
              ? 'Нет предстоящих бронирований'
              : 'Нет прошедших бронирований'
          }
          description="Здесь появятся ваши бронирования."
        />
      )}
    </div>
  );
}
