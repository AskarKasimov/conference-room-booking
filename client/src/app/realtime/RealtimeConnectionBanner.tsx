import WarningIcon from '../../shared/assets/icons/warning.svg?react';
import styles from './RealtimeConnectionBanner.module.scss';

export function RealtimeConnectionBanner() {
  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <WarningIcon aria-hidden="true" />
      <span>Соединение потеряно. Переподключение...</span>
    </div>
  );
}
