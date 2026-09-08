import { NavLink, Link } from 'react-router-dom';
import { useCurrentUserQuery } from '../../entities/user';
import styles from './Header.module.scss';

export function Header() {
  const user = useCurrentUserQuery().data;
  const displayName = user?.displayName ?? 'Загрузка профиля…';
  const initials = user?.initials ?? '…';
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
        <NavLink
          to="/rooms"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
          end={false}
        >
          Переговорные
        </NavLink>
        <NavLink
          to="/bookings"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Мои бронирования
        </NavLink>
      </nav>
      <div className={styles.profile}>
        <span className={styles.userName}>{displayName}</span>
        <span className={styles.user} aria-label={`${displayName}, ${initials}`}>
          {initials}
        </span>
      </div>
    </header>
  );
}
