import { Link } from '@tanstack/react-router';
import styles from './Header.module.scss';

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/rooms" className={styles.logo}>
        Переговорные
      </Link>
      <nav aria-label="Основная навигация" className={styles.nav}>
        <Link to="/rooms" activeProps={{ className: styles.active }}>
          Комнаты
        </Link>
        <Link to="/bookings" activeProps={{ className: styles.active }}>
          Мои бронирования
        </Link>
      </nav>
      <span className={styles.user}>АК</span>
    </header>
  );
}
