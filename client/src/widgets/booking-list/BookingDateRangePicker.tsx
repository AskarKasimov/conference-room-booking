import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import CalendarIcon from '../../shared/assets/icons/calendar.svg?react';
import ChevronDownIcon from '../../shared/assets/icons/chevron-down.svg?react';
import styles from './BookingDateRangePicker.module.scss';

const monthNames = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const monthNamesInDate = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function toDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year ?? 2000, (month ?? 1) - 1, day ?? 1));
}

function toValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatDate(value: string) {
  const date = toDate(value);
  return `${date.getUTCDate()} ${monthNamesInDate[date.getUTCMonth()]}`;
}

export function BookingDateRangePicker({
  from,
  to,
  onChange,
}: {
  from?: string | undefined;
  to?: string | undefined;
  onChange: (range: { from?: string | undefined; to?: string | undefined }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = from ? toDate(from) : new Date();
    return new Date(Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1));
  });
  const [draftStart, setDraftStart] = useState<string>();
  const selected = from && to ? `${formatDate(from)} — ${formatDate(to)}` : 'За все время';
  const firstDay = (month.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth
      ? new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day))
      : undefined;
  });

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={styles.trigger} aria-label="Выбрать период">
        <CalendarIcon aria-hidden="true" />
        <span>{selected}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.calendar} align="end" sideOffset={6}>
          <div className={styles.header}>
            <strong>{`${monthNames[month.getUTCMonth()]} ${month.getUTCFullYear()}`}</strong>
            <div>
              <button
                type="button"
                aria-label="Предыдущий месяц"
                onClick={() =>
                  setMonth(
                    (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)),
                  )
                }
              >
                <ChevronDownIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Следующий месяц"
                onClick={() =>
                  setMonth(
                    (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
                  )
                }
              >
                <ChevronDownIcon aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className={styles.weekdays} aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className={styles.days}>
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
              const value = toValue(date);
              const start = draftStart ?? from;
              const end = draftStart ? undefined : to;
              const inRange = Boolean(start && end && value >= start && value <= end);
              const selectedDay = value === start || value === end;
              return (
                <button
                  key={value}
                  type="button"
                  className={`${inRange ? styles.inRange : ''} ${selectedDay ? styles.selected : ''}`}
                  aria-label={`${date.getUTCDate()} ${monthNamesInDate[date.getUTCMonth()]}, ${weekdays[(date.getUTCDay() + 6) % 7]}`}
                  aria-pressed={selectedDay}
                  onClick={() => {
                    if (!draftStart) {
                      setDraftStart(value);
                      return;
                    }
                    const [nextFrom, nextTo] =
                      value < draftStart ? [value, draftStart] : [draftStart, value];
                    onChange({ from: nextFrom, to: nextTo });
                    setDraftStart(undefined);
                  }}
                >
                  {date.getUTCDate()}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              onChange({});
              setDraftStart(undefined);
              setOpen(false);
            }}
          >
            Сбросить период
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
