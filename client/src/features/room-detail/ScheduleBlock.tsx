import type { BookingView } from '../../api/contracts';
import { formatLocalTime } from '../../lib/time';
import styles from './RoomDetail.module.scss';

export function ScheduleBlock({
  booking,
  timezone,
  top,
  height,
  own,
}: {
  booking: BookingView;
  timezone: string;
  top: string;
  height: string;
  own: boolean;
}) {
  const title = own ? booking.title : 'Занято';
  const time = `${formatLocalTime(booking.startsAt, timezone)}–${formatLocalTime(booking.endsAt, timezone)}`;
  return (
    <li
      className={[styles.scheduleBlock, own ? styles.ownScheduleBlock : '']
        .filter(Boolean)
        .join(' ')}
      style={{ top, height }}
    >
      <strong>{title}</strong>
      <span>{time}</span>
    </li>
  );
}
