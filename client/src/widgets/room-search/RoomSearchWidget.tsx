import { useState } from 'react';
import { EmptyState } from '../../shared/ui';
import { ErrorState } from '../../shared/ui';
import { PageSkeleton } from '../../shared/ui';
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

export function OfficeSelection({
  offices,
  onOfficeChange,
}: {
  offices: Office[];
  onOfficeChange: (officeId: string) => void;
}) {
  return (
    <div className={styles.page}>
      <section className={styles.officePanel}>
        <OfficeSelector
          className={styles.officeSelector}
          offices={offices}
          value=""
          onChange={onOfficeChange}
        />
      </section>
      <EmptyState
        title="Выберите офис"
        description="Чтобы посмотреть доступные переговорные, сначала выберите офис."
      />
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
  if (!interval) {
    results = (
      <EmptyState
        title="Выберите корректный интервал"
        description="Начало должно быть в будущем, а бронирование — в пределах рабочего дня."
      />
    );
  } else if (rooms.isLoading) {
    results = <PageSkeleton label="Загрузка комнат…" />;
  } else if (rooms.isError) {
    results = (
      <ErrorState
        title="Не удалось загрузить комнаты"
        description="Попробуйте обновить список."
        onRetry={() => void rooms.refetch()}
      />
    );
  } else if (rooms.data?.length) {
    results = (
      <section className={styles.results}>
        <h1>Доступные переговорные в этом офисе</h1>
        <RoomGrid rooms={rooms.data} date={filters.date} onBook={onBook} />
      </section>
    );
  } else {
    results = (
      <EmptyState title="Комнаты не найдены" description="Измените фильтры и попробуйте снова." />
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
        <OfficeMeta className={styles.officeMeta} office={office} />
      </section>
      <section className={styles.filtersPanel}>
        <RoomFilters value={filters} timezone={timezone} now={now} onChange={onFiltersChange} />
      </section>
      {results}
      {bookingRoom && interval ? (
        <BookingDialog
          selection={{
            room: bookingRoom,
            date: filters.date,
            startTime: filters.startTime,
            durationMinutes: filters.duration,
          }}
          open
          onOpenChange={(open) => {
            if (!open) onBookingClose();
          }}
          onSuccess={(booking) => {
            setBookingSuccess(booking);
            onBookingClose();
          }}
        />
      ) : null}
    </div>
  );
}
