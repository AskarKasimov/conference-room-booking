import type { PropsWithChildren } from 'react';
import styles from './Alert.module.scss';

export function Alert({
  variant = 'info',
  children,
}: PropsWithChildren<{ variant?: 'info' | 'error' | 'success' }>) {
  return (
    <div
      className={`${styles.alert} ${styles[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
