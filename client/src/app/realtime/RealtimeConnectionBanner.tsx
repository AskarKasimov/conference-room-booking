import WarningIcon from '../../shared/assets/icons/warning.svg?react';
import styles from './RealtimeConnectionBanner.module.scss';

export function RealtimeConnectionBanner({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className={`${styles.banner} ${isVisible ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <WarningIcon aria-hidden="true" />
      <span>Соединение потеряно. Переподключение...</span>
    </div>
  );
}
