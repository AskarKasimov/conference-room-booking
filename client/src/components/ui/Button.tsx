import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  isLoading = false,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      disabled={props.disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? <span role="status">Загрузка…</span> : children}
    </button>
  );
}
