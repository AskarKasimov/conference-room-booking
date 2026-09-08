import { createFileRoute, Link } from '@tanstack/react-router';
import styles from '../components/ui/State.module.scss';

export const Route = createFileRoute('/$')({ component: NotFoundPage });

function NotFoundPage() {
  return (
    <section className={styles.notFound}>
      <p className={styles.code}>404</p>
      <h1>Страница не найдена</h1>
      <p>Запрашиваемая страница не существует, была удалена или перенесена на другой адрес.</p>
      <Link className={styles.primaryLink} to="/rooms">
        Вернуться к переговорным
      </Link>
    </section>
  );
}
