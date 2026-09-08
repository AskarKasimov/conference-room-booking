import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import styles from './AppShell.module.scss';

export function AppShell({ banner }: { banner?: ReactNode | undefined }) {
  return (
    <div className={styles.shell}>
      {banner}
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
