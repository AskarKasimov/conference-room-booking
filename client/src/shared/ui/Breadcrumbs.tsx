import { Link } from 'react-router-dom';
import ChevronRightIcon from '../assets/icons/chevron-right-room-detail.svg';
import styles from './Breadcrumbs.module.scss';

type RoomsBreadcrumb = {
  label: string;
  to: '/rooms';
  search?: { officeId?: string };
};

type BookingsBreadcrumb = {
  label: string;
  to: '/bookings';
};

type CurrentBreadcrumb = {
  label: string;
};

export type BreadcrumbItem = RoomsBreadcrumb | BookingsBreadcrumb | CurrentBreadcrumb;

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
              {index > 0 && <img src={ChevronRightIcon} alt="" aria-hidden="true" />}
              {isCurrent ? (
                <span aria-current="page">{item.label}</span>
              ) : 'to' in item && item.to === '/rooms' ? (
                <RoomsBreadcrumbLink item={item} />
              ) : 'to' in item && item.to === '/bookings' ? (
                <BookingsBreadcrumbLink item={item} />
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

function RoomsBreadcrumbLink({ item }: { item: RoomsBreadcrumb }) {
  const query = item.search?.officeId
    ? `?officeId=${encodeURIComponent(item.search.officeId)}`
    : '';
  return (
    <Link to={`/rooms${query}`} aria-current={undefined}>
      {item.label}
    </Link>
  );
}

function BookingsBreadcrumbLink({ item }: { item: BookingsBreadcrumb }) {
  return (
    <Link to="/bookings" aria-current={undefined}>
      {item.label}
    </Link>
  );
}
