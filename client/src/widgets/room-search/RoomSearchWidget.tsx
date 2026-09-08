import { useState } from 'react';
import { Button, DelayedContent, PageState } from '../../shared/ui';
import { OfficeSelector } from '../../features/select-office';
import { OfficeMeta, type Office } from '../../entities/office';
import { RoomFilters, type RoomFilterValue } from '../../features/search-rooms';
import { useRoomsQuery, type RoomSummary } from '../../entities/room';
import { buildOfficeInterval } from '../../shared/lib';
import {
  BookingDialog,
  BookingSuccessNotice,
  type BookingSuccess,
} from '../../features/create-booking';
import { useContextRegistration } from '../../shared/lib';
import { RoomGrid } from './RoomGrid';
import styles from './RoomSearch.module.scss';
import BuildingIcon from '../../shared/assets/icons/building.svg?react';
import AlertTriangleIcon from '../../shared/assets/icons/alert-triangle.svg?react';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function RoomCardSkeletonGrid({ className }: { className: string | undefined }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.roomCardSkeleton} data-room-card-skeleton key={index}>
          <div className={styles.skeletonCardTop}>
            <i />
            <i />
          </div>
          <div className={styles.skeletonCardMiddle}>
            <i />
            <i />
          </div>
          <i className={styles.skeletonAvailability} />
          <div className={styles.skeletonCardActions}>
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoomSearchSkeleton({ label = 'Загрузка офисов…' }: { label?: string }) {
  return (
    <div className={styles.page} role="status" aria-label={label}>
      <section
        className={`${styles.officePanel} ${styles.officeSkeleton}`}
        data-skeleton-section
        aria-hidden="true"
      >
        <i className={styles.officeTitleSkeleton} />
        <div className={styles.officeMetaSkeleton}>
          <i />
          <span />
          <i />
        </div>
      </section>
      <section
        className={`${styles.filtersPanel} ${styles.filtersSkeletonPanel}`}
        data-skeleton-section
        aria-hidden="true"
      >
        <div className={styles.filtersSkeleton}>
          {Array.from({ length: 4 }, (_, index) => (
            <div className={styles.filterSkeletonField} key={index}>
              <i />
              <i />
            </div>
          ))}
        </div>
      </section>
      <section className={styles.loadingResults} data-skeleton-section aria-hidden="true">
        <i className={styles.resultsTitleSkeleton} />
        <RoomCardSkeletonGrid className={styles.loadingGrid} />
      </section>
    </div>
  );
}

export function OfficeSelection({
  offices,
  onOfficeChange,
}: {
  offices: Office[];
  onOfficeChange: (officeId: string) => void;
}) {
  const timezone = offices.at(0)?.timezone ?? 'UTC';

  return (
    <div className={`${styles.page} ${styles.pageOfficeSelection}`}>
      <section className={`${styles.officePanel} ${styles.officePanelUnselected}`}>
        <OfficeSelector
          className={styles.officeSelector}
          offices={offices}
          value=""
          onChange={onOfficeChange}
        />
        <p className={styles.officeMeta}>
          <span>Адрес не выбран</span>
          <span className={styles.officeMetaDot} aria-hidden="true" />
          <span>Местное время: ---</span>
        </p>
      </section>
      <section className={`${styles.filtersPanel} ${styles.filtersPanelDisabled}`}>
        <RoomFilters
          value={{ date: '', startTime: '', duration: 0 }}
          timezone={timezone}
          disabled
          onChange={() => {}}
        />
      </section>
      <section className={styles.officeEmptyState}>
        <span className={styles.officeEmptyIcon} aria-hidden="true">
          <BuildingIcon />
        </span>
        <div className={styles.officeEmptyText}>
          <h1>Выберите офис</h1>
          <p>Для просмотра доступных переговорных сначала выберите офис из списка выше</p>
        </div>
      </section>
    </div>
  );
}

export function RoomSearchWidget({
  office,
  officeList,
  filters,
  timezone,
  now,
  interval,
  bookingRoom,
  onOfficeChange,
  onFiltersChange,
  onBook,
  onBookingClose,
}: {
  office: Office;
  officeList: Office[];
  filters: RoomFilterValue;
  timezone: string;
  now: Date;
  interval: ReturnType<typeof buildOfficeInterval> | undefined;
  bookingRoom?: RoomSummary | undefined;
  onOfficeChange: (officeId: string) => void;
  onFiltersChange: (filters: RoomFilterValue) => void;
  onBook: (room: RoomSummary) => void;
  onBookingClose: () => void;
}) {
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess>();
  const [bookingOpen, setBookingOpen] = useState(false);
  const rooms = useRoomsQuery(
    interval
      ? {
          officeId: office.id,
          from: interval.from,
          to: interval.to,
          ...(filters.minCapacity !== undefined ? { minCapacity: filters.minCapacity } : {}),
        }
      : undefined,
  );
  useContextRegistration(
    interval
      ? {
          roomsList: {
            officeId: office.id,
            interval,
            filters: {
              officeId: office.id,
              from: interval.from,
              to: interval.to,
              ...(filters.minCapacity !== undefined ? { minCapacity: filters.minCapacity } : {}),
            },
          },
        }
      : undefined,
  );

  let results: React.ReactNode;
  let fallback: React.ReactNode;
  if (!interval) {
    results = (
      <PageState
        variant="empty"
        className={styles.roomEmpty}
        bleed
        headingLevel={1}
        icon={<SearchIcon />}
        title="Выберите корректный интервал"
        description="Начало должно быть в будущем, а бронирование — в пределах рабочего дня."
      />
    );
  } else if (rooms.isLoading) {
    fallback = (
      <section className={styles.loadingResults} role="status" aria-label="Загрузка переговорных…">
        <i className={styles.resultsTitleSkeleton} aria-hidden="true" />
        <RoomCardSkeletonGrid className={styles.loadingGrid} />
      </section>
    );
  } else if (rooms.isError) {
    results = (
      <PageState
        variant="error"
        className={styles.roomError}
        bleed
        headingLevel={1}
        icon={<AlertTriangleIcon />}
        title="Не удалось загрузить данные"
        description="Произошла ошибка при загрузке списка переговорных"
        action={<Button onClick={() => void rooms.refetch()}>Попробовать снова</Button>}
      />
    );
  } else if (rooms.data?.length) {
    results = (
      <section className={styles.results}>
        <h1>Доступные переговорные в этом офисе</h1>
        <RoomGrid
          rooms={rooms.data}
          date={filters.date}
          onBook={(room) => {
            onBook(room);
            setBookingOpen(true);
          }}
        />
      </section>
    );
  } else {
    results = (
      <PageState
        variant="empty"
        className={styles.roomEmpty}
        bleed
        headingLevel={1}
        icon={<SearchIcon />}
        title="Нет доступных переговорных"
        description="Попробуйте изменить параметры фильтрации или выбрать другой офис"
        action={
          <Button
            onClick={() => {
              onFiltersChange({
                date: filters.date,
                startTime: filters.startTime,
                duration: filters.duration,
              });
            }}
          >
            Сбросить фильтры
          </Button>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      {bookingSuccess ? (
        <BookingSuccessNotice
          booking={bookingSuccess}
          onDismiss={() => setBookingSuccess(undefined)}
        />
      ) : null}
      <section className={styles.officePanel}>
        <OfficeSelector
          className={styles.officeSelector}
          offices={officeList}
          value={office.id}
          onChange={onOfficeChange}
        />
        <OfficeMeta
          className={styles.officeMeta}
          separatorClassName={styles.officeMetaDot}
          office={office}
        />
      </section>
      <section className={styles.filtersPanel}>
        <RoomFilters value={filters} timezone={timezone} now={now} onChange={onFiltersChange} />
      </section>
      <DelayedContent pending={Boolean(interval) && rooms.isLoading} fallback={fallback}>
        {results}
      </DelayedContent>
      {bookingRoom && interval ? (
        <BookingDialog
          selection={{
            room: bookingRoom,
            date: filters.date,
            startTime: filters.startTime,
            durationMinutes: filters.duration,
          }}
          open={bookingOpen}
          onOpenChange={(open) => {
            setBookingOpen(open);
          }}
          onCloseComplete={onBookingClose}
          onSuccess={(booking) => {
            setBookingSuccess(booking);
          }}
        />
      ) : null}
    </div>
  );
}
