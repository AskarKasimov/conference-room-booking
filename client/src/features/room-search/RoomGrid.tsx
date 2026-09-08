import type { RoomSummary } from '../../api/contracts';
import { RoomCard } from './RoomCard';
import styles from './RoomSearch.module.scss';

export function RoomGrid({
  rooms,
  date,
  onBook,
}: {
  rooms: RoomSummary[];
  date: string;
  onBook: (room: RoomSummary) => void;
}) {
  return (
    <div className={styles.grid}>
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} date={date} onBook={onBook} />
      ))}
    </div>
  );
}
