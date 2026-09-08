import { Outlet } from '@tanstack/react-router';
import { Header } from './Header';
import styles from './AppShell.module.scss';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
