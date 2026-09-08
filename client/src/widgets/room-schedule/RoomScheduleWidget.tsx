import { useState } from 'react';
import { DateTime } from 'luxon';
import { Button, DelayedContent, PageState } from '../../shared/ui';
import { DaySchedule, getDefaultDuration, getNextSlot } from '../../entities/booking';
import type { RoomWithOffice } from '../../entities/room';
import type { useRoomScheduleQuery } from '../../entities/booking';
import { useContextRegistration } from '../../shared/lib';
import { useCurrentUserQuery } from '../../entities/user';
import { BookingDialog } from '../../features/create-booking';
import AlertTriangleIcon from '../../shared/assets/icons/alert-triangle.svg?react';
import { ScheduleDateControl } from './ScheduleDateControl';
import styles from './RoomScheduleWidget.module.scss';

export function RoomScheduleWidget({
  room,
  date,
  today,
  maxDate,
  schedule,
  onDateChange,
}: {
  room: RoomWithOffice;
  date: string;
  today: string;
  maxDate: string;
  schedule: ReturnType<typeof useRoomScheduleQuery>;
  onDateChange: (date: string) => void;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const currentUser = useCurrentUserQuery();
  useContextRegistration({ selectedRoom: { roomId: room.id, date } });
  const preferredSlot =
    date === today ? getNextSlot(room.office.timezone) : { date, startTime: '09:00' };

  return (
    <>
      <div className={`${styles.scheduleWrap} ${schedule.isError ? styles.scheduleErrorCard : ''}`}>
        {schedule.isError ? (
          <PageState
            className={styles.scheduleError}
            variant="error"
            icon={<AlertTriangleIcon />}
            title="Не удалось загрузить расписание"
            description="Произошла ошибка при загрузке расписания переговорной"
            action={<Button onClick={() => void schedule.refetch()}>Попробовать снова</Button>}
          />
        ) : (
          <>
            <div className={styles.scheduleHeader}>
              <div>
                <h2>Расписание на день</h2>
                <p>
                  {DateTime.fromISO(date, { zone: room.office.timezone })
                    .setLocale('ru')
                    .toFormat('cccc, d MMMM')}
                </p>
              </div>
              <ScheduleDateControl value={date} min={today} max={maxDate} onChange={onDateChange} />
            </div>
            <DelayedContent
              pending={schedule.isFetching}
              fallback={
                <div
                  className={styles.scheduleSkeleton}
                  role="status"
                  aria-label="Загрузка расписания…"
                >
                  <div className={styles.scheduleSkeletonHeader} />
                  <div className={styles.scheduleSkeletonRows} />
                </div>
              }
            >
              <DaySchedule
                bookings={schedule.data ?? []}
                timezone={room.office.timezone}
                date={date}
                currentUserId={currentUser.data?.id}
              />
            </DelayedContent>
            <div className={styles.scheduleActions}>
              <Button type="button" onClick={() => setBookingOpen(true)}>
                Забронировать комнату
              </Button>
            </div>
          </>
        )}
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
    </>
  );
}
