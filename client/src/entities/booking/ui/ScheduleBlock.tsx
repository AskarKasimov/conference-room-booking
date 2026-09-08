import type { BookingView } from '../model/types';
import { formatLocalTime, formatMoscowOffset } from '../../../shared/lib';
import styles from './Schedule.module.scss';

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
  const timezoneLabel = formatMoscowOffset(timezone, booking.startsAt);
  const isFifteenMinuteBooking =
    Date.parse(booking.endsAt) - Date.parse(booking.startsAt) === 15 * 60_000;
  return (
    <li
      className={[styles.scheduleBlock, own ? styles.ownScheduleBlock : '']
        .filter(Boolean)
        .join(' ')}
      style={{ top, height }}
      aria-label={`${title}, ${time}`}
      title={`${title}, ${time} ${timezoneLabel}`}
    >
      {!isFifteenMinuteBooking ? <strong>{title}</strong> : null}
    </li>
  );
}
