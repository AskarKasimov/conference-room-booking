import type { Office, Room } from '../../api/contracts';
import styles from './RoomDetail.module.scss';

export function RoomSummaryCard({ room }: { room: Room & { office: Office } }) {
  return (
    <section className={styles.summary}>
      <h1>{room.name}</h1>
      <p>
        {room.office.name} · {room.office.address}
      </p>
      <dl>
        <div>
          <dt>Вместимость</dt>
          <dd>{room.capacity} человек</dd>
        </div>
        <div>
          <dt>Этаж</dt>
          <dd>{room.floor}</dd>
        </div>
      </dl>
      <div>
        <strong>Оснащение</strong>
        <p>{room.features.map((feature) => feature.name).join(' · ') || 'Не указано'}</p>
      </div>
    </section>
  );
}
