import { Link } from '@tanstack/react-router';
import styles from './Header.module.scss';

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/rooms" className={styles.logo} aria-label="BookRoom">
        <span className={styles.logoMark} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4m8-4v4M4 10h16m-8 3v4m-2-2h4" />
          </svg>
        </span>
        <span>BookRoom</span>
      </Link>
      <nav aria-label="Основная навигация" className={styles.nav}>
        <Link
          to="/rooms"
          activeProps={{ className: styles.active }}
          activeOptions={{ exact: false }}
        >
          Переговорные
        </Link>
        <Link to="/bookings" activeProps={{ className: styles.active }}>
          Мои бронирования
        </Link>
      </nav>
      <div className={styles.profile}>
        <span className={styles.userName}>Константин К.</span>
        <span className={styles.user} aria-label="Константин К., КК">
          КК
        </span>
      </div>
    </header>
  );
}
