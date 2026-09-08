import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ErrorState } from '../../../shared/ui';
import { Breadcrumbs, type BreadcrumbItem } from '../../../shared/ui';
import { PageSkeleton } from '../../../shared/ui';
import { RoomSummaryCard } from '../../../widgets/room-summary-card';
import { RoomScheduleWidget } from '../../../widgets/room-schedule';
import { useRoomDetailQuery } from '../../../entities/room';
import styles from './RoomDetailPage.module.scss';

export function RoomDetailPage() {
  const { roomId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get('date');
  const roomQuery = useRoomDetailQuery(roomId);
  let content: React.ReactNode;
  let normalizedDate: string | undefined;
  let breadcrumbs: BreadcrumbItem[] = [
    { label: 'Переговорные', to: '/rooms' },
    { label: 'Комната' },
  ];

  if (roomQuery.isLoading) {
    content = <PageSkeleton label="Загрузка комнаты…" />;
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

    breadcrumbs = [
      { label: 'Переговорные', to: '/rooms' },
      { label: room.office.name, to: '/rooms', search: { officeId: room.office.id } },
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
