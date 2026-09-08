import { DateTime } from 'luxon';
import type { BookingView } from '../model/types';
import { ScheduleBlock } from './ScheduleBlock';
import styles from './Schedule.module.scss';

const WORKDAY_MINUTES = 660;

export function DaySchedule({
  bookings,
  timezone,
  date,
  currentUserId = '',
}: {
  bookings: BookingView[];
  timezone: string;
  date: string;
  currentUserId?: string | undefined;
}) {
  const startOfDay = DateTime.fromISO(`${date}T09:00`, { zone: timezone });
  const blocks = bookings.flatMap((booking) => {
    const start = DateTime.fromISO(booking.startsAt, { setZone: true }).setZone(timezone);
    const end = DateTime.fromISO(booking.endsAt, { setZone: true }).setZone(timezone);
    const topMinutes = Math.max(0, start.diff(startOfDay, 'minutes').minutes);
    const bottomMinutes = Math.min(WORKDAY_MINUTES, end.diff(startOfDay, 'minutes').minutes);
    if (bottomMinutes <= 0 || topMinutes >= WORKDAY_MINUTES || bottomMinutes <= topMinutes)
      return [];
    return [
      {
        booking,
        top: `${((topMinutes / WORKDAY_MINUTES) * 100).toFixed(4)}%`,
        height: `${(((bottomMinutes - topMinutes) / WORKDAY_MINUTES) * 100).toFixed(4)}%`,
      },
    ];
  });
  return (
    <section className={styles.schedule} aria-label={`Расписание на ${date}`}>
      <div className={styles.scheduleScale}>
        {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
          <span key={hour}>{String(hour).padStart(2, '0')}:00</span>
        ))}
      </div>
      <ol className={styles.scheduleTrack}>
        {blocks.map(({ booking, top, height }) => (
          <ScheduleBlock
            key={booking.id}
            booking={booking}
            timezone={timezone}
            top={top}
            height={height}
            own={booking.userId === currentUserId}
          />
        ))}
      </ol>
    </section>
  );
}
