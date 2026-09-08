import { useEffect, useRef } from 'react';
import { DateTime } from 'luxon';
import CloseIcon from '../../../shared/assets/icons/close.svg?react';
import styles from './Booking.module.scss';

export interface BookingSuccess {
  roomName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
}

export function BookingSuccessNotice({
  booking,
  onDismiss,
}: {
  booking: BookingSuccess;
  onDismiss: () => void;
}) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismissRef.current(), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [
    booking.date,
    booking.durationMinutes,
    booking.roomName,
    booking.startTime,
    booking.timezone,
  ]);

  const startsAt = DateTime.fromISO(`${booking.date}T${booking.startTime}`, {
    zone: booking.timezone,
  }).setLocale('ru');
  const endsAt = startsAt.plus({ minutes: booking.durationMinutes });

  return (
    <div className={styles.successNotice} role="status">
      <span className={styles.successIcon} aria-hidden="true">
        ✓
      </span>
      <div>
        <strong>Бронирование создано</strong>
        <p>
          Комната {booking.roomName}, {startsAt.toFormat('d MMMM')}, {startsAt.toFormat('HH:mm')}–
          {endsAt.toFormat('HH:mm')} ({booking.timezone})
        </p>
      </div>
      <button
        className={styles.successDismiss}
        type="button"
        aria-label="Закрыть уведомление"
        onClick={onDismiss}
      >
        <CloseIcon aria-hidden="true" />
      </button>
    </div>
  );
}
