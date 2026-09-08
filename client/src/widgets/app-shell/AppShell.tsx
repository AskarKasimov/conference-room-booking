import { Outlet } from 'react-router-dom';
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
