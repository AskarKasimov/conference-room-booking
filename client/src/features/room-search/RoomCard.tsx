import type { RoomSummary } from '../../api/contracts';
import { Button } from '../../components/ui/Button';
import styles from './RoomSearch.module.scss';

export function RoomCard({
  room,
  availability = room.available,
  onBook,
}: {
  room: RoomSummary;
  availability?: boolean;
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
        <span aria-hidden="true">♧</span> Вместимость: до {room.capacity} человек
      </p>
      <p className={styles.meta}>
        <span aria-hidden="true">◷</span>{' '}
        {availability ? 'Свободна весь день' : 'Занята на выбранное время'}
      </p>
      <p
        className={`${styles.availability} ${availability ? styles.available : styles.unavailable}`}
      >
        <span aria-hidden="true">●</span>
        {availability ? 'Доступно на выбранное время' : 'Недоступно на выбранное время'}
      </p>
      <div className={styles.cardActions}>
        <a href={`/rooms/${room.id}`}>Подробнее</a>
        <Button disabled={!availability} onClick={() => onBook(room)}>
          Забронировать
        </Button>
      </div>
    </article>
  );
}
