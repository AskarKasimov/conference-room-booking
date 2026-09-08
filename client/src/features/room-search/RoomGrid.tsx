import type { RoomSummary } from '../../api/contracts';
import { RoomCard } from './RoomCard';
import styles from './RoomSearch.module.scss';

export function RoomGrid({
  rooms,
  onBook,
}: {
  rooms: RoomSummary[];
  onBook: (room: RoomSummary) => void;
}) {
  return (
    <div className={styles.grid}>
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onBook={onBook} />
      ))}
    </div>
  );
}
