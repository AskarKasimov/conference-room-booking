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
          <p>
            {room.office.name} · {room.floor} этаж
          </p>
        </div>
        <span className={availability ? styles.available : styles.unavailable}>
          {availability ? 'Свободна' : 'Занята'}
        </span>
      </div>
      <p>До {room.capacity} человек</p>
      <p>{room.features.map((feature) => feature.name).join(' · ') || 'Оснащение не указано'}</p>
      <div className={styles.cardActions}>
        <a href={`/rooms/${room.id}`}>Подробнее</a>
        <Button disabled={!availability} onClick={() => onBook(room)}>
          {availability ? 'Забронировать' : 'Недоступно'}
        </Button>
      </div>
    </article>
  );
}
