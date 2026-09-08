import { createFileRoute } from '@tanstack/react-router';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { BookingList } from '../features/my-bookings/BookingList';
import { BookingTabs } from '../features/my-bookings/BookingTabs';
import { BookingsFilters } from '../features/my-bookings/BookingsFilters';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { Button } from '../components/ui/Button';
import { useBookingsQuery } from '../hooks/useBookingsQuery';
import { useOfficesQuery } from '../hooks/useOfficesQuery';
import styles from '../features/my-bookings/MyBookings.module.scss';

export const Route = createFileRoute('/bookings')({
  validateSearch: (search: Record<string, unknown>) => ({
    scope:
      search.scope === 'past' || search.scope === 'all'
        ? (search.scope as 'past' | 'all')
        : ('upcoming' as const),
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
      <div className={styles.pageHeader}>
        <h1>Мои бронирования</h1>
        <div className={styles.toolbar}>
          <BookingsFilters
            offices={offices.data ?? []}
            value={search.officeId}
            onChange={(officeId) => void navigate({ search: { scope: search.scope, officeId } })}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void navigate({ search: { scope: 'all', officeId: search.officeId } })}
          >
            За все время
          </Button>
        </div>
      </div>
      <BookingTabs scope={search.scope} officeId={search.officeId} />
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
    </div>
  );
}
