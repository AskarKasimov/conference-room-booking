import type { SelectHTMLAttributes } from 'react';
import styles from './Select.module.scss';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ label, error, id, className, children, ...props }: SelectProps) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label className={styles.field} htmlFor={selectId}>
      <span>{label}</span>
      <select
        {...props}
        id={selectId}
        className={[styles.select, className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
      >
        {children}
      </select>
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}
