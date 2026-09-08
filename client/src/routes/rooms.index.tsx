import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { OfficeSelector } from '../features/offices/OfficeSelector';
import { OfficeMeta } from '../features/offices/OfficeMeta';
import { RoomFilters, type RoomFilterValue } from '../features/room-search/RoomFilters';
import { RoomGrid } from '../features/room-search/RoomGrid';
import { getDefaultRoomFilters } from '../features/room-search/searchParams';
import { normalizeRoomsSearch } from '../features/room-search/searchParams';
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
import { useClock } from '../hooks/useClock';

export function RoomsPage() {
  const [bookingRoom, setBookingRoom] = useState<import('../api/contracts').RoomSummary>();
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess>();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = useClock();
  const search = normalizeRoomsSearch(Object.fromEntries(searchParams.entries()));
  const offices = useOfficesQuery();
  const officeList = offices.data ?? [];
  const selectedOffice = officeList.find((item) => item.id === search.officeId);
  const office = selectedOffice;
  const defaults = office ? getDefaultRoomFilters(office, now) : undefined;
  useEffect(() => {
    if (!offices.isSuccess || !search.officeId || selectedOffice) return;
    const params = new URLSearchParams(searchParams);
    params.delete('officeId');
    setSearchParams(params, { replace: true });
  }, [offices.isSuccess, search.officeId, selectedOffice, searchParams, setSearchParams]);
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
  } else if (officeList.length === 0) {
    content = (
      <EmptyState
        title="Нет доступных офисов"
        description="Когда офисы появятся, здесь можно будет выбрать переговорную."
      />
    );
  } else if (!office) {
    content = (
      <>
        <section className={styles.officePanel}>
          <OfficeSelector
            className={styles.officeSelector}
            offices={officeList}
            value=""
            onChange={(officeId) => {
              const selected = officeList.find((item) => item.id === officeId);
              if (!selected) return;
              setSearchParams(
                new URLSearchParams({
                  officeId,
                  ...Object.fromEntries(
                    Object.entries(getDefaultRoomFilters(selected)).map(([key, value]) => [
                      key,
                      String(value),
                    ]),
                  ),
                }),
              );
            }}
          />
        </section>
        <EmptyState
          title="Выберите офис"
          description="Чтобы посмотреть доступные переговорные, сначала выберите офис."
        />
      </>
    );
  } else {
    const selectOffice = (officeId: string) => {
      const selected = officeList.find((item) => item.id === officeId);
      if (!selected) return;
      setSearchParams(
        new URLSearchParams({
          officeId,
          ...Object.fromEntries(
            Object.entries(getDefaultRoomFilters(selected)).map(([key, value]) => [
              key,
              String(value),
            ]),
          ),
        }),
      );
    };
    const filters = {
      date: search.date ?? defaults!.date,
      startTime: search.startTime ?? defaults!.startTime,
      duration: search.duration ?? defaults!.duration,
      minCapacity: search.minCapacity,
    };
    let interval: ReturnType<typeof buildOfficeInterval> | undefined;
    try {
      interval = buildOfficeInterval({
        ...filters,
        durationMinutes: filters.duration,
        timezone: office.timezone,
        now,
      });
    } catch {
      interval = undefined;
    }
    const updateFilters = (next: RoomFilterValue) => {
      const params = new URLSearchParams();
      const values = { officeId: office.id, ...filters, ...next };
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value));
      });
      setSearchParams(params);
    };
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
          <RoomFilters
            value={filters}
            timezone={office.timezone}
            now={now}
            onChange={updateFilters}
          />
        </section>
        <RoomsResults
          officeId={office.id}
          interval={interval}
          minCapacity={filters.minCapacity}
          date={filters.date}
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
  date,
  onBook,
}: {
  officeId: string;
  interval?: ReturnType<typeof buildOfficeInterval> | undefined;
  minCapacity?: number | undefined;
  date: string;
  onBook: (room: import('../api/contracts').RoomSummary) => void;
}) {
  const rooms = useRoomsQuery(
    interval
      ? {
          officeId,
          from: interval.from,
          to: interval.to,
          ...(minCapacity !== undefined ? { minCapacity } : {}),
        }
      : undefined,
  );
  useRealtimeActiveContext(
    interval
      ? {
          roomsList: {
            officeId,
            interval,
            filters: {
              officeId,
              from: interval.from,
              to: interval.to,
              ...(minCapacity !== undefined ? { minCapacity } : {}),
            },
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
      <RoomGrid rooms={rooms.data} date={date} onBook={onBook} />
    </section>
  ) : (
    <EmptyState title="Комнаты не найдены" description="Измените фильтры и попробуйте снова." />
  );
}
