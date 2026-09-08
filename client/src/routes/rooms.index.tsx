import { createFileRoute } from '@tanstack/react-router';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
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
import { BookingDialog } from '../features/booking/BookingDialog';
import {
  BookingSuccessNotice,
  type BookingSuccess,
} from '../features/booking/BookingSuccessNotice';
import { useRealtimeActiveContext } from '../realtime/RealtimeProvider';

export const Route = createFileRoute('/rooms/')({ component: RoomsPage });

function RoomsPage() {
  const [bookingRoom, setBookingRoom] = useState<import('../api/contracts').RoomSummary>();
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess>();
  const search = useSearch({ from: '/rooms' });
  const navigate = useNavigate({ from: '/rooms' });
  const offices = useOfficesQuery();
  const officeList = offices.data ?? [];
  const selectedOffice = officeList.find((item) => item.id === search.officeId);
  const office = selectedOffice ?? officeList[0];
  useEffect(() => {
    if (!office || selectedOffice) return;
    void navigate({
      replace: true,
      search: { officeId: office.id, ...getDefaultRoomFilters(office), minCapacity: undefined },
    });
  }, [navigate, office, selectedOffice]);
  let content: React.ReactNode;
  if (offices.isLoading) {
    content = <PageSkeleton label="Загрузка офисов…" />;
  } else if (offices.isError) {
    content = (
      <ErrorState
        title="Не удалось загрузить офисы"
        description="Попробуйте повторить запрос."
        onRetry={() => void offices.refetch()}
      />
    );
  } else if (!office) {
    content = (
      <EmptyState
        title="Нет доступных офисов"
        description="Когда офисы появятся, здесь можно будет выбрать переговорную."
      />
    );
  } else {
    const selectOffice = (officeId: string) => {
      const selected = officeList.find((item) => item.id === officeId);
      if (!selected) return;
      void navigate({
        search: { officeId, ...getDefaultRoomFilters(selected), minCapacity: undefined },
      });
    };
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
    content = (
      <>
        {bookingSuccess ? (
          <BookingSuccessNotice
            booking={bookingSuccess}
            onDismiss={() => setBookingSuccess(undefined)}
          />
        ) : null}
        <section className={styles.officePanel}>
          <OfficeSelector
            className={styles.officeSelector}
            offices={officeList}
            value={office.id}
            onChange={selectOffice}
          />
          <OfficeMeta className={styles.officeMeta} office={office} />
        </section>
        <section className={styles.filtersPanel}>
          <RoomFilters value={filters} onChange={updateFilters} />
        </section>
        <RoomsResults
          officeId={office.id}
          interval={interval}
          minCapacity={filters.minCapacity}
          onBook={setBookingRoom}
        />
        {bookingRoom && interval ? (
          <BookingDialog
            selection={{
              room: bookingRoom,
              date: filters.date,
              startTime: filters.startTime,
              durationMinutes: filters.duration,
            }}
            open
            onOpenChange={(open) => {
              if (!open) setBookingRoom(undefined);
            }}
            onSuccess={setBookingSuccess}
          />
        ) : null}
      </>
    );
  }

  return <div className={styles.page}>{content}</div>;
}

function RoomsResults({
  officeId,
  interval,
  minCapacity,
  onBook,
}: {
  officeId: string;
  interval?: ReturnType<typeof buildOfficeInterval>;
  minCapacity?: number;
  onBook: (room: import('../api/contracts').RoomSummary) => void;
}) {
  const rooms = useRoomsQuery(
    interval ? { officeId, from: interval.from, to: interval.to, minCapacity } : undefined,
  );
  useRealtimeActiveContext(
    interval
      ? {
          roomsList: {
            officeId,
            interval,
            filters: { officeId, from: interval.from, to: interval.to, minCapacity },
          },
        }
      : undefined,
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
    <section className={styles.results}>
      <h1>Доступные переговорные в этом офисе</h1>
      <RoomGrid rooms={rooms.data} onBook={onBook} />
    </section>
  ) : (
    <EmptyState title="Комнаты не найдены" description="Измените фильтры и попробуйте снова." />
  );
}
