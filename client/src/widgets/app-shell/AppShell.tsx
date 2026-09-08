import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import styles from './AppShell.module.scss';

export function AppShell({
  banner,
  roomsHref,
  bookingsHref,
}: {
  banner?: ReactNode | undefined;
  roomsHref: string;
  bookingsHref: string;
}) {
  return (
    <div className={styles.shell}>
      {banner}
      <Header roomsHref={roomsHref} bookingsHref={bookingsHref} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
