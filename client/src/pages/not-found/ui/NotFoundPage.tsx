import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.scss';

export function NotFoundPage() {
  return (
    <section className={styles.notFound}>
      <div className={styles.illustration}>
        <p className={styles.code}>404</p>
        <h1>Страница не найдена</h1>
        <p>Запрашиваемая страница не существует, была удалена или перенесена на другой адрес.</p>
      </div>
      <Link className={styles.primaryLink} to="/rooms">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
        Вернуться к переговорным
      </Link>
    </section>
  );
}
