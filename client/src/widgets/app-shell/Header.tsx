import { NavLink, Link, useLocation } from 'react-router-dom';
import { useCurrentUserQuery } from '../../entities/user';
import { useSlidingIndicator } from '../../shared/lib';
import CalendarCheckIcon from '../../shared/assets/icons/calendar-check-room-detail.svg';
import AvatarCircleIcon from '../../shared/assets/icons/avatar-circle.svg';
import styles from './Header.module.scss';

export function Header() {
  const { pathname } = useLocation();
  const { containerRef, indicatorStyle, ready } = useSlidingIndicator(pathname);
  const user = useCurrentUserQuery().data;
  const displayName = user?.displayName ?? 'Загрузка профиля…';
  const displayNameParts = displayName.trim().split(/\s+/);
  const firstName = displayNameParts[0];
  const surname = displayNameParts.at(-1);
  const shortDisplayName =
    displayNameParts.length > 1 && firstName && surname
      ? `${firstName} ${surname.charAt(0)}.`
      : displayName;
  const initials = user?.initials ?? '…';
  return (
    <header className={styles.header}>
      <Link to="/rooms" className={styles.logo} aria-label="BookRoom">
        <span className={styles.logoMark} aria-hidden="true">
          <img src={CalendarCheckIcon} alt="" />
        </span>
        <span>BookRoom</span>
      </Link>
      <nav ref={containerRef} aria-label="Основная навигация" className={styles.nav}>
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
        <span
          aria-hidden="true"
          className={styles.indicator}
          data-ready={ready}
          style={indicatorStyle}
        />
      </nav>
      <div className={styles.profile}>
        <span className={styles.userName}>{shortDisplayName}</span>
        <span className={styles.user} aria-label={`${displayName}, ${initials}`}>
          <img src={AvatarCircleIcon} alt="" />
          <span>{initials}</span>
        </span>
      </div>
    </header>
  );
}
