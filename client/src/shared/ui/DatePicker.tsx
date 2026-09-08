import * as Popover from '@radix-ui/react-popover';
import { useEffect, useState } from 'react';
import CalendarIcon from '../assets/icons/calendar.svg?react';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import styles from './DatePicker.module.scss';

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
  'Января',
  'Февраля',
  'Марта',
  'Апреля',
  'Мая',
  'Июня',
  'Июля',
  'Августа',
  'Сентября',
  'Октября',
  'Ноября',
  'Декабря',
];
const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const calendarWeekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function dateFromValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return new Date(NaN);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function dateLabel(date: Date) {
  return `${date.getUTCDate()} ${monthNamesInDate[date.getUTCMonth()]}, ${weekdayNames[date.getUTCDay()]}`;
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

export function DatePicker({
  label = 'Дата',
  value,
  onValueChange,
  min,
  max,
  className,
  id,
  ariaInvalid,
  ariaDescribedBy,
}: {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string | undefined;
  id?: string | undefined;
  ariaInvalid?: boolean | undefined;
  ariaDescribedBy?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => monthStart(dateFromValue(value)));
  const selected = dateFromValue(value);
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

  useEffect(() => {
    setMonth(monthStart(dateFromValue(value)));
  }, [value]);

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          id={id}
          className={styles.trigger}
          aria-label={dateLabel(selected)}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        >
          <CalendarIcon aria-hidden="true" />
          {dateLabel(selected)}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className={styles.calendar} align="start" sideOffset={6}>
            <div className={styles.calendarHeader}>
              <strong>{`${monthNames[month.getUTCMonth()]} ${month.getUTCFullYear()}`}</strong>
              <div>
                <button
                  type="button"
                  className={styles.calendarNav}
                  aria-label="Предыдущий месяц"
                  onClick={() => setMonth((current) => addMonths(current, -1))}
                >
                  <ChevronDownIcon aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.calendarNav}
                  aria-label="Следующий месяц"
                  onClick={() => setMonth((current) => addMonths(current, 1))}
                >
                  <ChevronDownIcon aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className={styles.calendarWeekdays} aria-hidden="true">
              {calendarWeekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className={styles.calendarDays}>
              {cells.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
                const nextValue = dateValue(date);
                const disabled =
                  (min !== undefined && nextValue < min) || (max !== undefined && nextValue > max);
                return (
                  <button
                    key={nextValue}
                    type="button"
                    className={nextValue === value ? styles.selectedDay : undefined}
                    aria-label={dateLabel(date)}
                    aria-pressed={nextValue === value}
                    disabled={disabled}
                    onClick={() => {
                      onValueChange(nextValue);
                      setOpen(false);
                    }}
                  >
                    {date.getUTCDate()}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
