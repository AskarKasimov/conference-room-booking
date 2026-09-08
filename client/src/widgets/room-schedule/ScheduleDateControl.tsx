import { DatePicker } from '../../shared/ui';
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
      value={value}
      min={min}
      max={max}
      onValueChange={onChange}
    />
  );
}
