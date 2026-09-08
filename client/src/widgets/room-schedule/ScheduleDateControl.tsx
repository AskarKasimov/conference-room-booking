import { DatePicker } from '../../shared/ui';
import CalendarIcon from '../../shared/assets/icons/calendar-room-detail.svg?react';
import styles from './RoomScheduleWidget.module.scss';

export function ScheduleDateControl({
  value,
  min,
  max,
  onChange,
}: {
  value: string;
  min: string;
  max: string;
  onChange: (date: string) => void;
}) {
  return (
    <DatePicker
      className={styles.dateControl}
      label="Дата расписания"
      hideLabel
      triggerLabel="Выбрать дату"
      leadingIcon={<CalendarIcon aria-hidden="true" />}
      value={value}
      min={min}
      max={max}
      onValueChange={onChange}
    />
  );
}
