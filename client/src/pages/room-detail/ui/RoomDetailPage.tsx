import { useEffect } from 'react';
import { parsePath, useParams, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { DelayedContent, ErrorState } from '../../../shared/ui';
import { Breadcrumbs, type BreadcrumbItem } from '../../../shared/ui';
import { RoomSummaryCard } from '../../../widgets/room-summary-card';
import { RoomScheduleWidget } from '../../../widgets/room-schedule';
import { useRoomDetailQuery } from '../../../entities/room';
import { useRoomScheduleQuery } from '../../../entities/booking';
import { normalizeRoomsSearch } from '../../../features/search-rooms';
import styles from './RoomDetailPage.module.scss';

export function RoomDetailPage({ roomsListHref = '/rooms' }: { roomsListHref?: string }) {
  const { roomId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get('date');
  const roomQuery = useRoomDetailQuery(roomId);
  const room = roomQuery.data;
  const today = room ? (DateTime.now().setZone(room.office.timezone).toISODate() ?? '') : '';
  const maxDate = room
    ? (DateTime.fromISO(today, { zone: room.office.timezone }).plus({ days: 30 }).toISODate() ??
      today)
    : '';
  const requestedDateTime = requestedDate ? DateTime.fromISO(requestedDate) : null;
  const requestedIsValid = Boolean(
    requestedDateTime?.isValid && requestedDateTime.toISODate() === requestedDate,
  );
  const date =
    room && today && maxDate
      ? requestedIsValid && requestedDate! >= today && requestedDate! <= maxDate
        ? requestedDate!
        : today
      : '';
  const scheduleQuery = useRoomScheduleQuery(
    room?.id ?? '',
    date,
    room?.office.timezone ?? 'UTC',
    Boolean(room && date),
  );
  const showLoadingSkeleton =
    roomQuery.isLoading || (room !== undefined && scheduleQuery.isLoading);
  let content: React.ReactNode;
  const normalizedDate = date || undefined;
  let breadcrumbs: BreadcrumbItem[] = [
    { label: 'Переговорные', to: roomsListHref },
    { label: 'Комната' },
  ];

  if (showLoadingSkeleton) {
    content = (
      <DelayedContent
        pending
        fallback={
          <div className={styles.loadingLayout} role="status" aria-label="Загрузка комнаты…">
            <section className={styles.infoSkeleton} aria-hidden="true">
              <div className={styles.infoTitleSection}>
                <i className={styles.infoTitle} />
                <i className={styles.infoSubtitle} />
              </div>
              <i className={styles.infoDivider} />
              <div className={styles.infoRows}>
                {Array.from({ length: room ? room.features.length + 1 : 4 }, (_, index) => (
                  <div className={styles.infoRow} data-info-row key={index}>
                    <i />
                    <i />
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.scheduleSkeleton} aria-hidden="true">
              <div className={styles.scheduleHeader}>
                <div>
                  <i />
                  <i />
                </div>
                <i />
              </div>
              <div className={styles.timeGrid}>
                {Array.from({ length: 12 }, (_, index) => (
                  <div className={styles.timeRow} data-time-row key={index}>
                    <span>{`${String(index + 9).padStart(2, '0')}:00`}</span>
                    <i />
                  </div>
                ))}
              </div>
              <i className={styles.scheduleAction} />
            </section>
          </div>
        }
      />
    );
  } else if (roomQuery.isError || !room || !today || !date) {
    content = (
      <ErrorState
        title="Не удалось загрузить комнату"
        description="Комната не найдена или временно недоступна."
        onRetry={() => void roomQuery.refetch()}
      />
    );
  } else {
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
          schedule={scheduleQuery}
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
      {showLoadingSkeleton ? (
        <div className={styles.breadcrumbSkeleton} aria-hidden="true">
          <i />
          <span />
          <i />
          <span />
          <i />
        </div>
      ) : (
        <Breadcrumbs items={breadcrumbs} />
      )}
      {content}
    </div>
  );
}
