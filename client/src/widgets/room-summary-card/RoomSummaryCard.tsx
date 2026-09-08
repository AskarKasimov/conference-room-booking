import type { RoomWithOffice } from '../../entities/room';
import DisplayIcon from '../../shared/assets/icons/display.svg?react';
import UsersIcon from '../../shared/assets/icons/users-room-detail.svg?react';
import TvIcon from '../../shared/assets/icons/tv-room-detail.svg?react';
import EditIcon from '../../shared/assets/icons/edit-3-room-detail.svg?react';
import VideoIcon from '../../shared/assets/icons/video-room-detail.svg?react';
import styles from './RoomSummaryCard.module.scss';

const featureIcons = {
  display: TvIcon,
  screen: TvIcon,
  whiteboard: EditIcon,
  board: EditIcon,
  video: VideoIcon,
} as const;

export function RoomSummaryCard({ room }: { room: RoomWithOffice }) {
  return (
    <section className={styles.summary}>
      <div className={styles.titleSection}>
        <h1>{room.name}</h1>
        <p>
          {room.office.name} · {room.office.address}
        </p>
      </div>
      <hr className={styles.divider} />
      <ul className={styles.featureList}>
        <li>
          <UsersIcon aria-hidden="true" data-testid="feature-icon-capacity" />
          Вместимость: до {room.capacity} человек
        </li>
        {room.features.map((feature) => {
          const FeatureIcon =
            featureIcons[feature.code as keyof typeof featureIcons] ?? DisplayIcon;
          return (
            <li key={feature.code}>
              <FeatureIcon aria-hidden="true" data-testid={`feature-icon-${feature.code}`} />
              {feature.name}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
