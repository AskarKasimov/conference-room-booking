import { Link } from 'react-router-dom';
import ClockIcon from '../../../shared/assets/icons/clock.svg?react';
import PeopleIcon from '../../../shared/assets/icons/people.svg?react';
import { Button } from '../../../shared/ui';
import type { RoomSummary } from '../model/types';
import styles from './RoomCard.module.scss';

export function RoomCard({
  room,
  availability = room.available,
  date,
  onBook,
}: {
  room: RoomSummary;
  availability?: boolean | undefined;
  date?: string | undefined;
  requestedInterval?: { date: string; startTime: string; durationMinutes: number };
  onBook: (room: RoomSummary) => void;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeading}>
        <div>
          <h2>{room.name}</h2>
          <p>{room.floor} этаж</p>
        </div>
      </div>
      <p className={styles.meta}>
        <PeopleIcon aria-hidden="true" />
        Вместимость: до {room.capacity} человек
      </p>
      <p className={styles.meta}>
        <ClockIcon aria-hidden="true" />
        {availability === true
          ? 'Свободна на выбранное время'
          : availability === false
            ? 'Занята на выбранное время'
            : 'Доступность не подтверждена'}
      </p>
      <p
        className={`${styles.availability} ${availability === true ? styles.available : styles.unavailable}`}
      >
        <span aria-hidden="true">●</span>
        {availability === true
          ? 'Доступно на выбранное время'
          : availability === false
            ? 'Недоступно на выбранное время'
            : 'Неизвестна для выбранного времени'}
      </p>
      <div className={styles.cardActions}>
        <Link
          className={styles.cardDetails}
          to={{ pathname: `/rooms/${room.id}`, search: date ? `?date=${date}` : '' }}
        >
          Подробнее
        </Link>
        <Button
          className={`${styles.cardBookButton} ${availability !== true ? styles.disabledBookButton : ''}`}
          disabled={availability !== true}
          onClick={() => onBook(room)}
        >
          Забронировать
        </Button>
      </div>
    </article>
  );
}
