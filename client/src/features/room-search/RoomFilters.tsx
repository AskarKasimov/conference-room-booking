import * as Select from '@radix-ui/react-select';
import { type ComponentType, type SVGProps } from 'react';
import ChevronDownIcon from '../../assets/icons/chevron-down.svg?react';
import ClockIcon from '../../assets/icons/clock.svg?react';
import PeopleIcon from '../../assets/icons/people.svg?react';
import { DatePicker } from '../../components/ui/DatePicker';
import { formatDuration, getDurationOptions, getTimeOptions } from './searchParams';
import styles from './RoomSearch.module.scss';

export interface RoomFilterValue {
  date: string;
  startTime: string;
  duration: number;
  minCapacity?: number;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  chevron = false,
  className,
  valuePrefix,
  minValueLabel,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  chevron?: boolean;
  className?: string;
  valuePrefix?: string;
  minValueLabel?: string;
}) {
  const emptyValue = '__empty_filter_option__';
  return (
    <label className={`${styles.field} ${className ?? ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <Select.Root
        value={value || (options.some(([optionValue]) => optionValue === '') ? emptyValue : '')}
        onValueChange={(next) => onChange(next === emptyValue ? '' : next)}
      >
        <Select.Trigger className={styles.select} aria-label={label}>
          {Icon && <Icon className={styles.fieldIcon} aria-hidden="true" />}
          <span className={styles.selectValue}>
            {valuePrefix}
            <Select.Value />
            {minValueLabel && (
              <span className={styles.minValueMeasure} aria-hidden="true">
                {minValueLabel}
              </span>
            )}
          </span>
          {chevron && <ChevronDownIcon className={styles.chevron} aria-hidden="true" />}
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.selectContent} position="popper">
            <Select.Viewport>
              {options.map(([optionValue, optionLabel]) => (
                <Select.Item
                  key={optionValue}
                  value={optionValue || emptyValue}
                  className={styles.selectItem}
                >
                  <Select.ItemText>{optionLabel}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}

export function RoomFilters({
  value,
  onChange,
}: {
  value: RoomFilterValue;
  onChange: (value: RoomFilterValue) => void;
}) {
  const update = (next: Partial<RoomFilterValue>) => onChange({ ...value, ...next });
  const updateStartTime = (startTime: string) => {
    const durationOptions = getDurationOptions(startTime);
    update({
      startTime,
      duration: durationOptions.includes(value.duration)
        ? value.duration
        : (durationOptions.at(-1) ?? 15),
    });
  };

  return (
    <div className={styles.filters}>
      <DatePicker
        className={styles.dateField}
        value={value.date}
        onValueChange={(date) => update({ date })}
      />
      <FilterSelect
        label="Время начала"
        value={value.startTime}
        onChange={updateStartTime}
        options={getTimeOptions().map((time): [string, string] => [time, time])}
        icon={ClockIcon}
        className={styles.timeField}
      />
      <FilterSelect
        label="Длительность"
        value={String(value.duration)}
        onChange={(duration) => update({ duration: Number(duration) })}
        options={getDurationOptions(value.startTime).map((minutes): [string, string] => [
          String(minutes),
          formatDuration(minutes),
        ])}
        chevron
        className={styles.durationField}
        minValueLabel="10 ч 45 мин"
      />
      <FilterSelect
        label="Вместимость"
        value={String(value.minCapacity ?? '')}
        onChange={(minCapacity) =>
          update({ minCapacity: minCapacity ? Number(minCapacity) : undefined })
        }
        options={[
          ['', 'Любая'],
          ...[2, 4, 6, 8, 10, 12].map((capacity): [string, string] => [
            String(capacity),
            `${capacity} чел.`,
          ]),
        ]}
        icon={PeopleIcon}
        chevron
        className={styles.capacityField}
        valuePrefix={value.minCapacity ? 'Мин. ' : undefined}
      />
    </div>
  );
}
