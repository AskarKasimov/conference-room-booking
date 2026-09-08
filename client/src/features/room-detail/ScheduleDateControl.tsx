import styles from './RoomDetail.module.scss';

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
    <label className={styles.dateControl}>
      <span>Дата расписания</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
