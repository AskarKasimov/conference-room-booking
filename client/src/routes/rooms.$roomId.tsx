import { createFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { ErrorState } from '../components/ui/ErrorState';
import { Breadcrumbs, type BreadcrumbItem } from '../components/ui/Breadcrumbs';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { Button } from '../components/ui/Button';
import { DaySchedule } from '../features/room-detail/DaySchedule';
import { RoomSummaryCard } from '../features/room-detail/RoomSummaryCard';
import { ScheduleDateControl } from '../features/room-detail/ScheduleDateControl';
import { useRoomDetailQuery } from '../hooks/useRoomDetailQuery';
import { useRoomScheduleQuery } from '../hooks/useRoomScheduleQuery';
import styles from '../features/room-detail/RoomDetail.module.scss';
import { BookingDialog } from '../features/booking/BookingDialog';
import { getNextSlot } from '../features/room-search/searchParams';
import { useRealtimeActiveContext } from '../realtime/RealtimeProvider';

export const Route = createFileRoute('/rooms/$roomId')({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === 'string' ? search.date : undefined,
  }),
  component: RoomDetailPage,
});

function RoomDetailPage() {
  const { roomId } = useParams({ from: '/rooms/$roomId' });
  const search = useSearch({ from: '/rooms/$roomId' });
  const roomQuery = useRoomDetailQuery(roomId);
  let content: React.ReactNode;
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
    const date = search.date ?? today;
    const maxDate = DateTime.fromISO(today).plus({ days: 30 }).toISODate() ?? today;
    breadcrumbs = [
      { label: 'Переговорные', to: '/rooms' },
      { label: room.office.name, to: '/rooms', search: { officeId: room.office.id } },
      { label: `Комната '${room.name}'` },
    ];
    content = (
      <RoomDetailContent room={room} roomId={roomId} date={date} today={today} maxDate={maxDate} />
    );
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs items={breadcrumbs} />
      {content}
    </div>
  );
}

function RoomDetailContent({
  room,
  roomId,
  date,
  today,
  maxDate,
}: {
  room: Awaited<ReturnType<typeof import('../api/endpoints').api.getRoom>>;
  roomId: string;
  date: string;
  today: string;
  maxDate: string;
}) {
  const navigate = useNavigate({ from: '/rooms/$roomId' });
  const [bookingOpen, setBookingOpen] = useState(false);
  const schedule = useRoomScheduleQuery(roomId, date, room.office.timezone);
  useRealtimeActiveContext({ selectedRoom: { roomId, date } });
  const preferredSlot =
    date === today ? getNextSlot(room.office.timezone) : { date, startTime: '09:00' };
  return (
    <>
      <div className={styles.layout}>
        <RoomSummaryCard room={room} />
        <div className={styles.scheduleWrap}>
          <div className={styles.scheduleHeader}>
            <div>
              <h2>Расписание на день</h2>
              <p>
                {DateTime.fromISO(date, { zone: room.office.timezone })
                  .setLocale('ru')
                  .toFormat('cccc, d LLLL')}
              </p>
            </div>
            <ScheduleDateControl
              value={date}
              min={today}
              max={maxDate}
              onChange={(nextDate) => void navigate({ search: { date: nextDate } })}
            />
          </div>
          {schedule.isLoading ? (
            <PageSkeleton label="Загрузка расписания…" />
          ) : schedule.isError ? (
            <ErrorState
              title="Не удалось загрузить расписание"
              description="Попробуйте обновить расписание."
              onRetry={() => void schedule.refetch()}
            />
          ) : (
            <DaySchedule
              bookings={schedule.data ?? []}
              timezone={room.office.timezone}
              date={date}
            />
          )}
          <div className={styles.scheduleActions}>
            <Button type="button" onClick={() => setBookingOpen(true)}>
              Забронировать комнату
            </Button>
          </div>
        </div>
      </div>
      <BookingDialog
        selection={{
          room,
          date,
          startTime: preferredSlot.startTime,
          durationMinutes: 60,
        }}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </>
  );
}
