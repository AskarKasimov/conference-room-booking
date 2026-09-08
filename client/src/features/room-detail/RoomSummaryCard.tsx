import type { Office, Room } from '../../api/contracts';
import DisplayIcon from '../../assets/icons/display.svg?react';
import PeopleIcon from '../../assets/icons/people.svg?react';
import VideoIcon from '../../assets/icons/video.svg?react';
import WhiteboardIcon from '../../assets/icons/whiteboard.svg?react';
import styles from './RoomDetail.module.scss';

const featureIcons = {
  display: DisplayIcon,
  screen: DisplayIcon,
  whiteboard: WhiteboardIcon,
  board: WhiteboardIcon,
  video: VideoIcon,
} as const;

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
          <PeopleIcon aria-hidden="true" data-testid="feature-icon-capacity" />
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
