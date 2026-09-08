import { Select } from '../../components/ui/Select';
import { getDurationOptions, getTimeOptions } from './searchParams';
import styles from './RoomSearch.module.scss';

export interface RoomFilterValue {
  date: string;
  startTime: string;
  duration: number;
  minCapacity?: number;
}

export function RoomFilters({
  value,
  onChange,
}: {
  value: RoomFilterValue;
  onChange: (value: RoomFilterValue) => void;
}) {
  const update = (key: keyof RoomFilterValue, next: string) =>
    onChange({
      ...value,
      [key]: key === 'duration' || key === 'minCapacity' ? (next ? Number(next) : undefined) : next,
    });
  return (
    <div className={styles.filters}>
      <label className={styles.field}>
        <span>Дата</span>
        <input
          type="date"
          value={value.date}
          onChange={(event) => update('date', event.target.value)}
        />
      </label>
      <Select
        label="Начало"
        value={value.startTime}
        onChange={(event) => update('startTime', event.target.value)}
      >
        {getTimeOptions().map((time) => (
          <option key={time}>{time}</option>
        ))}
      </Select>
      <Select
        label="Продолжительность"
        value={String(value.duration)}
        onChange={(event) => update('duration', event.target.value)}
      >
        {getDurationOptions(value.startTime).map((minutes) => (
          <option key={minutes} value={minutes}>
            {minutes} мин
          </option>
        ))}
      </Select>
      <Select
        label="Вместимость"
        value={value.minCapacity ?? ''}
        onChange={(event) => update('minCapacity', event.target.value)}
      >
        <option value="">Любая</option>
        {[4, 8, 12, 20].map((capacity) => (
          <option key={capacity} value={capacity}>
            {capacity}+ человек
          </option>
        ))}
      </Select>
    </div>
  );
}
