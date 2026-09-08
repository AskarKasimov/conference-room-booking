import type { ReactNode } from 'react';
import styles from './PageState.module.scss';

export function PageState({
  variant,
  icon,
  title,
  description,
  action,
  headingLevel = 2,
  bleed = false,
  className,
}: {
  variant: 'empty' | 'error';
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  headingLevel?: 1 | 2;
  bleed?: boolean;
  className?: string | undefined;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <section
      className={`${styles.state} ${styles[variant]} ${bleed ? styles.bleed : ''} ${className ?? ''}`}
      {...(variant === 'error' ? { role: 'alert' } : {})}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.copy}>
        <Heading className={styles.title}>{title}</Heading>
        <p className={styles.description}>{description}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
