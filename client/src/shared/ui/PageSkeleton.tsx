import styles from './State.module.scss';

export function PageSkeleton({ label = 'Загрузка…' }: { label?: string }) {
  return <div className={styles.skeleton} role="status" aria-label={label} />;
}
