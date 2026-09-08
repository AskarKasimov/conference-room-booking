import { useEffect } from 'react';
import { parsePath, useParams, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { DelayedContent, ErrorState } from '../../../shared/ui';
import { Breadcrumbs, type BreadcrumbItem } from '../../../shared/ui';
import { RoomSummaryCard } from '../../../widgets/room-summary-card';
import { RoomScheduleWidget } from '../../../widgets/room-schedule';
import { useRoomDetailQuery } from '../../../entities/room';
import { normalizeRoomsSearch } from '../../../features/search-rooms';
import styles from './RoomDetailPage.module.scss';

export function RoomDetailPage({ roomsListHref = '/rooms' }: { roomsListHref?: string }) {
  const { roomId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get('date');
  const roomQuery = useRoomDetailQuery(roomId);
  let content: React.ReactNode;
  let normalizedDate: string | undefined;
  let breadcrumbs: BreadcrumbItem[] = [
    { label: 'Переговорные', to: roomsListHref },
    { label: 'Комната' },
  ];

  if (roomQuery.isLoading) {
    content = (
      <DelayedContent
        pending
        fallback={
          <div className={styles.loadingLayout} role="status" aria-label="Загрузка комнаты…">
            <div className={styles.infoSkeleton} />
            <div className={styles.scheduleSkeleton}>
              <div />
              <div />
              <div />
            </div>
          </div>
        }
      />
    );
  } else if (roomQuery.isError || !roomQuery.data) {
    content = (
      <ErrorState
        title="Не удалось загрузить комнату"
        description="Комната не найдена или временно недоступна."
        onRetry={() => void roomQuery.refetch()}
      />
    );
  } else {
    const room = roomQuery.data;
    const today = DateTime.now().setZone(room.office.timezone).toISODate() ?? '';
    const maxDate =
      DateTime.fromISO(today, { zone: room.office.timezone }).plus({ days: 30 }).toISODate() ??
      today;
    const requestedDateTime = requestedDate ? DateTime.fromISO(requestedDate) : null;
    const requestedIsValid = Boolean(
      requestedDateTime?.isValid && requestedDateTime.toISODate() === requestedDate,
    );
    const date =
      requestedIsValid && requestedDate! >= today && requestedDate! <= maxDate
        ? requestedDate!
        : today;
    normalizedDate = date;

    const listSearch = normalizeRoomsSearch(
      Object.fromEntries(new URLSearchParams(parsePath(roomsListHref).search)),
    );
    breadcrumbs = [
      { label: 'Переговорные', to: roomsListHref },
      {
        label: room.office.name,
        to:
          listSearch.officeId === room.office.id
            ? roomsListHref
            : `/rooms?${new URLSearchParams({ officeId: room.office.id }).toString()}`,
      },
      { label: `Комната '${room.name}'` },
    ];
    content = (
      <div className={styles.layout}>
        <RoomSummaryCard room={room} />
        <RoomScheduleWidget
          room={room}
          date={date}
          today={today}
          maxDate={maxDate}
          onDateChange={(nextDate) => setSearchParams({ date: nextDate })}
        />
      </div>
    );
  }

  useEffect(() => {
    if (normalizedDate && requestedDate !== normalizedDate) {
      setSearchParams({ date: normalizedDate }, { replace: true });
    }
  }, [normalizedDate, requestedDate, setSearchParams]);

  return (
    <div className={styles.page}>
      <Breadcrumbs items={breadcrumbs} />
      {content}
    </div>
  );
}
