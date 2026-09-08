import { useState } from 'react';
import { DateTime } from 'luxon';
import { ErrorState } from '../../shared/ui';
import { PageSkeleton } from '../../shared/ui';
import { Button } from '../../shared/ui';
import { DaySchedule, getDefaultDuration, getNextSlot } from '../../entities/booking';
import type { RoomWithOffice } from '../../entities/room';
import { useRoomScheduleQuery } from '../../entities/booking';
import { useContextRegistration } from '../../shared/lib';
import { useCurrentUserQuery } from '../../entities/user';
import { BookingDialog } from '../../features/create-booking';
import { ScheduleDateControl } from './ScheduleDateControl';
import styles from './RoomScheduleWidget.module.scss';

export function RoomScheduleWidget({
  room,
  date,
  today,
  maxDate,
  onDateChange,
}: {
  room: RoomWithOffice;
  date: string;
  today: string;
  maxDate: string;
  onDateChange: (date: string) => void;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const currentUser = useCurrentUserQuery();
  const schedule = useRoomScheduleQuery(room.id, date, room.office.timezone);
  useContextRegistration({ selectedRoom: { roomId: room.id, date } });
  const preferredSlot =
    date === today ? getNextSlot(room.office.timezone) : { date, startTime: '09:00' };

  return (
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
        <ScheduleDateControl value={date} min={today} max={maxDate} onChange={onDateChange} />
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
          currentUserId={currentUser.data?.id}
        />
      )}
      <div className={styles.scheduleActions}>
        <Button type="button" onClick={() => setBookingOpen(true)}>
          Забронировать комнату
        </Button>
      </div>
      <BookingDialog
        selection={{
          room,
          date: preferredSlot.date,
          startTime: preferredSlot.startTime,
          durationMinutes: getDefaultDuration(preferredSlot.startTime),
        }}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </div>
  );
}
