import { createFileRoute } from '@tanstack/react-router';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { OfficeSelector } from '../features/offices/OfficeSelector';
import { OfficeMeta } from '../features/offices/OfficeMeta';
import { RoomFilters, type RoomFilterValue } from '../features/room-search/RoomFilters';
import { RoomGrid } from '../features/room-search/RoomGrid';
import { getDefaultRoomFilters } from '../features/room-search/searchParams';
import { useOfficesQuery } from '../hooks/useOfficesQuery';
import { useRoomsQuery } from '../hooks/useRoomsQuery';
import { buildOfficeInterval } from '../lib/time';
import styles from '../features/room-search/RoomSearch.module.scss';

export const Route = createFileRoute('/rooms/')({ component: RoomsPage });

function RoomsPage() {
  const search = useSearch({ from: '/rooms' });
  const navigate = useNavigate({ from: '/rooms' });
  const offices = useOfficesQuery();
  if (offices.isLoading) return <PageSkeleton label="Загрузка офисов…" />;
  if (offices.isError)
    return (
      <ErrorState
        title="Не удалось загрузить офисы"
        description="Попробуйте повторить запрос."
        onRetry={() => void offices.refetch()}
      />
    );
  if (!offices.data?.length)
    return (
      <EmptyState
        title="Нет доступных офисов"
        description="Когда офисы появятся, здесь можно будет выбрать переговорную."
      />
    );
  const office = offices.data.find((item) => item.id === search.officeId);
  const selectOffice = (officeId: string) => {
    const selected = offices.data.find((item) => item.id === officeId);
    if (!selected) return;
    void navigate({
      search: { officeId, ...getDefaultRoomFilters(selected), minCapacity: undefined },
    });
  };
  if (!office)
    return (
      <div className={styles.page}>
        <h1>Переговорные комнаты</h1>
        <div className={styles.toolbar}>
          <OfficeSelector offices={offices.data} value={search.officeId} onChange={selectOffice} />
        </div>
        <EmptyState
          title="Выберите офис"
          description="Чтобы увидеть доступные комнаты, сначала выберите офис."
        />
      </div>
    );
  const filters = {
    date: search.date ?? getDefaultRoomFilters(office).date,
    startTime: search.startTime ?? getDefaultRoomFilters(office).startTime,
    duration: search.duration ?? 60,
    minCapacity: search.minCapacity,
  };
  let interval: ReturnType<typeof buildOfficeInterval> | undefined;
  try {
    interval = buildOfficeInterval({
      ...filters,
      durationMinutes: filters.duration,
      timezone: office.timezone,
    });
  } catch {
    interval = undefined;
  }
  const updateFilters = (next: RoomFilterValue) =>
    void navigate({ search: { ...search, ...next, officeId: office.id } });
  return (
    <div className={styles.page}>
      <div>
        <h1>Переговорные комнаты</h1>
        <OfficeMeta office={office} />
      </div>
      <div className={styles.toolbar}>
        <OfficeSelector offices={offices.data} value={office.id} onChange={selectOffice} />
        <RoomFilters value={filters} onChange={updateFilters} />
      </div>
      <RoomsResults officeId={office.id} interval={interval} minCapacity={filters.minCapacity} />
    </div>
  );
}

function RoomsResults({
  officeId,
  interval,
  minCapacity,
}: {
  officeId: string;
  interval?: ReturnType<typeof buildOfficeInterval>;
  minCapacity?: number;
}) {
  const rooms = useRoomsQuery(
    interval ? { officeId, from: interval.from, to: interval.to, minCapacity } : undefined,
  );
  if (!interval)
    return (
      <EmptyState
        title="Выберите корректный интервал"
        description="Начало должно быть в будущем, а бронирование — в пределах рабочего дня."
      />
    );
  if (rooms.isLoading) return <PageSkeleton label="Загрузка комнат…" />;
  if (rooms.isError)
    return (
      <ErrorState
        title="Не удалось загрузить комнаты"
        description="Попробуйте обновить список."
        onRetry={() => void rooms.refetch()}
      />
    );
  return rooms.data?.length ? (
    <RoomGrid rooms={rooms.data} onBook={() => undefined} />
  ) : (
    <EmptyState title="Комнаты не найдены" description="Измените фильтры и попробуйте снова." />
  );
}
