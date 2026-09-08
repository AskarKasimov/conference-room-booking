import { NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useCurrentUserQuery } from '../../entities/user';
import { useSlidingIndicator } from '../../shared/lib';
import CalendarCheckIcon from '../../shared/assets/icons/calendar-check-room-detail.svg?react';
import AvatarCircleIcon from '../../shared/assets/icons/avatar-circle.svg?react';
import styles from './Header.module.scss';

export function Header({ roomsHref, bookingsHref }: { roomsHref: string; bookingsHref: string }) {
  const { pathname } = useLocation();
  const { containerRef, indicatorStyle, ready } = useSlidingIndicator(pathname);
  const userQuery = useCurrentUserQuery();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [containerRef, menuOpen]);
  const user = userQuery.data;
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
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
          <CalendarCheckIcon aria-hidden="true" />
        </span>
        <span>BookRoom</span>
      </Link>
      <nav
        id="primary-navigation"
        ref={containerRef}
        aria-label="Основная навигация"
        className={styles.nav}
        data-open={menuOpen}
      >
        <NavLink
          to={roomsHref}
          className={({ isActive }) => (isActive ? styles.active : undefined)}
          end={false}
          onClick={() => setMenuOpen(false)}
        >
          Переговорные
        </NavLink>
        <NavLink
          to={bookingsHref}
          className={({ isActive }) => (isActive ? styles.active : undefined)}
          onClick={() => setMenuOpen(false)}
        >
          Мои бронирования
        </NavLink>
        <div className={styles.profile}>
          <span className={styles.userName}>{shortDisplayName}</span>
          <span className={styles.user} aria-label={`${displayName}, ${initials}`}>
            {userQuery.isPending ? (
              <span className={styles.avatarSkeleton} role="status" aria-label="Загрузка аватара…" />
            ) : (
              <>
                <span className={styles.avatarFallback} aria-hidden="true">
                  <AvatarCircleIcon aria-hidden="true" />
                  <span>{initials}</span>
                </span>
                {user?.avatarUrl && failedAvatarUrl !== user.avatarUrl && (
                  <img
                    className={styles.avatarImage}
                    src={user.avatarUrl}
                    alt="Аватар пользователя"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                      setFailedAvatarUrl(user.avatarUrl);
                    }}
                  />
                )}
              </>
            )}
          </span>
        </div>
        <span
          aria-hidden="true"
          className={styles.indicator}
          data-ready={ready}
          style={indicatorStyle}
        />
      </nav>
      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuButton}
        aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {menuOpen ? (
            <path d="m6 6 12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
    </header>
  );
}
