import { useCallback, useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import CloseIcon from '../../../shared/assets/icons/close.svg?react';
import { formatMoscowOffset } from '../../../shared/lib';
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
  const exitingRef = useRef(false);
  const exitTimeoutRef = useRef<number | undefined>(undefined);
  const [isExiting, setIsExiting] = useState(false);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);
  const beginDismiss = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setIsExiting(true);
    exitTimeoutRef.current = window.setTimeout(() => onDismissRef.current(), 180);
  }, []);
  useEffect(() => {
    exitingRef.current = false;
    setIsExiting(false);
    const timeoutId = window.setTimeout(beginDismiss, 5000);
    return () => {
      window.clearTimeout(timeoutId);
      if (exitTimeoutRef.current !== undefined) {
        window.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = undefined;
      }
    };
  }, [
    booking.date,
    booking.durationMinutes,
    booking.roomName,
    booking.startTime,
    booking.timezone,
    beginDismiss,
  ]);

  const startsAt = DateTime.fromISO(`${booking.date}T${booking.startTime}`, {
    zone: booking.timezone,
  }).setLocale('ru');
  const endsAt = startsAt.plus({ minutes: booking.durationMinutes });
  const timeZoneAbbreviation = formatMoscowOffset(booking.timezone, startsAt.toISO() ?? '');

  return (
    <div
      className={styles.successNotice}
      data-state={isExiting ? 'exiting' : 'visible'}
      role="status"
    >
      <span className={styles.successIcon} aria-hidden="true">
        ✓
      </span>
      <div>
        <strong>Бронирование создано</strong>
        <p>
          Комната {booking.roomName}, {startsAt.toFormat('d MMMM')}, {startsAt.toFormat('HH:mm')}–
          {endsAt.toFormat('HH:mm')} ({timeZoneAbbreviation})
        </p>
      </div>
      <button
        className={styles.successDismiss}
        type="button"
        aria-label="Закрыть уведомление"
        onClick={beginDismiss}
      >
        <CloseIcon aria-hidden="true" />
      </button>
    </div>
  );
}
