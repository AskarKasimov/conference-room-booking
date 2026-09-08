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
  const compact = Date.parse(booking.endsAt) - Date.parse(booking.startsAt) <= 30 * 60_000;
  return (
    <li
      className={[
        styles.scheduleBlock,
        compact ? styles.compactScheduleBlock : '',
        own ? styles.ownScheduleBlock : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ top, height }}
      aria-label={`${title}, ${time}`}
      title={`${title}, ${time}`}
    >
      <strong>{title}</strong>
      <span>{time}</span>
    </li>
  );
}
