import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui';
import { ErrorState } from '../../../shared/ui';
import { DelayedContent, PageSkeleton } from '../../../shared/ui';
import { getDefaultRoomFilters } from '../../../entities/booking';
import { useOfficesQuery } from '../../../entities/office';
import type { RoomSummary } from '../../../entities/room';
import { buildOfficeInterval } from '../../../shared/lib';
import { normalizeRoomsSearch } from '../../../features/search-rooms';
import { useClock } from '../../../shared/lib';
import { OfficeSelection, RoomSearchWidget } from '../../../widgets/room-search';
import styles from './RoomsPage.module.scss';

export function RoomsPage() {
  const [bookingRoom, setBookingRoom] = useState<RoomSummary>();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = useClock();
  const search = normalizeRoomsSearch(Object.fromEntries(searchParams.entries()));
  const offices = useOfficesQuery();
  const officeList = offices.data ?? [];
  const office = officeList.find((item) => item.id === search.officeId);
  const defaults = office ? getDefaultRoomFilters(office, now) : undefined;

  useEffect(() => {
    if (!offices.isSuccess || !search.officeId || office) return;
    const params = new URLSearchParams(searchParams);
    params.delete('officeId');
    setSearchParams(params, { replace: true });
  }, [offices.isSuccess, search.officeId, office, searchParams, setSearchParams]);

  if (offices.isLoading) {
    return (
      <div className={styles.page}>
        <DelayedContent pending fallback={<PageSkeleton label="Загрузка офисов…" />} />
      </div>
    );
  }
  if (offices.isError) {
    return (
      <div className={styles.page}>
        <ErrorState
          title="Не удалось загрузить офисы"
          description="Попробуйте повторить запрос."
          onRetry={() => void offices.refetch()}
        />
      </div>
    );
  }
  if (officeList.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Нет доступных офисов"
          description="Когда офисы появятся, здесь можно будет выбрать переговорную."
        />
      </div>
    );
  }
  if (!office) {
    return <OfficeSelection offices={officeList} onOfficeChange={selectOffice} />;
  }

  const filters = {
    date: search.date ?? defaults!.date,
    startTime: search.startTime ?? defaults!.startTime,
    duration: search.duration ?? defaults!.duration,
    ...(search.minCapacity !== undefined ? { minCapacity: search.minCapacity } : {}),
  };
  let interval: ReturnType<typeof buildOfficeInterval> | undefined;
  try {
    interval = buildOfficeInterval({
      date: filters.date,
      startTime: filters.startTime,
      durationMinutes: filters.duration,
      timezone: office.timezone,
      now,
    });
  } catch {
    interval = undefined;
  }

  function selectOffice(officeId: string) {
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
  }

  return (
    <RoomSearchWidget
      office={office}
      officeList={officeList}
      filters={filters}
      timezone={office.timezone}
      now={now}
      interval={interval}
      bookingRoom={bookingRoom}
      onOfficeChange={selectOffice}
      onBook={setBookingRoom}
      onBookingClose={() => setBookingRoom(undefined)}
      onFiltersChange={(next) => {
        const params = new URLSearchParams();
        const values = { officeId: office.id, ...filters, ...next };
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== '') params.set(key, String(value));
        });
        setSearchParams(params);
      }}
    />
  );
}
