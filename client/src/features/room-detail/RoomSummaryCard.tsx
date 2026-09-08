import type { Office, Room } from '../../api/contracts';
import styles from './RoomDetail.module.scss';

export function RoomSummaryCard({ room }: { room: Room & { office: Office } }) {
  return (
    <section className={styles.summary}>
      <h1>{room.name}</h1>
      <p>
        {room.office.name} · {room.office.address}
      </p>
      <hr />
      <ul className={styles.featureList}>
        <li>
          <span aria-hidden="true">♧</span> Вместимость: до {room.capacity} человек
        </li>
        {room.features.map((feature) => (
          <li key={feature.code}>
            <span aria-hidden="true">◈</span>
            {feature.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
