import type { ReactNode } from 'react';
import { DateTime } from 'luxon';
import OfficeIcon from '../../../shared/assets/icons/office.svg?react';
import { formatLocalTime, formatMoscowOffset } from '../../../shared/lib';
import type { BookingView } from '../model/types';
import styles from './BookingCard.module.scss';

export function BookingCard({ booking, action }: { booking: BookingView; action?: ReactNode }) {
  const localDate = DateTime.fromISO(booking.startsAt, { setZone: true })
    .setZone(booking.office.timezone)
    .setLocale('ru');
  return (
    <article className={styles.row}>
      <div className={styles.date}>
        <span>{localDate.toFormat('LLLL').toUpperCase()}</span>
        <strong>{localDate.toFormat('d')}</strong>
      </div>
      <div className={styles.bookingInfo}>
        <h2>{booking.title}</h2>
        <p className={styles.metadata}>
          <OfficeIcon aria-hidden="true" />
          <span className={styles.roomName}>{booking.room.name}</span>
          <span className={styles.metadataSeparator} aria-hidden="true">
            •
          </span>
          <span className={styles.metadataItem}>{booking.room.floor} этаж</span>
          <span className={styles.metadataSeparator} aria-hidden="true">
            •
          </span>
          <span className={styles.metadataItem}>
            {formatLocalTime(booking.startsAt, booking.office.timezone)} -{' '}
            {formatLocalTime(booking.endsAt, booking.office.timezone)}{' '}
            {formatMoscowOffset(booking.office.timezone, booking.startsAt)}
          </span>
        </p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </article>
  );
}
