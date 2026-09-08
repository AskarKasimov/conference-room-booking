import { Button } from './Button';
import styles from './State.module.scss';

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <section className={styles.state} role="alert">
      <span className={`${styles.stateIcon} ${styles.errorIcon}`} aria-hidden="true">
        !
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button variant="secondary" onClick={onRetry}>
        Повторить
      </Button>
    </section>
  );
}
