import { Link, type To } from 'react-router-dom';
import ChevronRightIcon from '../assets/icons/chevron-right-room-detail.svg?react';
import styles from './Breadcrumbs.module.scss';

export type BreadcrumbItem = {
  label: string;
  to?: To;
};

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav
      aria-label="Навигационная цепочка"
      className={[styles.breadcrumbs, className].filter(Boolean).join(' ')}
    >
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && <ChevronRightIcon aria-hidden="true" />}
              {isCurrent ? (
                <span aria-current="page">{item.label}</span>
              ) : item.to !== undefined ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
