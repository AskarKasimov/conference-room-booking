import * as Primitive from '@radix-ui/react-select';
import styles from './Select.module.scss';

const emptyValue = '__empty_option__';

export function Select({
  label,
  value,
  options,
  onValueChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  const radixValue = value || (options.some((option) => option.value === '') ? emptyValue : '');
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <Primitive.Root
        value={radixValue}
        onValueChange={(next) => onValueChange(next === emptyValue ? '' : next)}
      >
        <Primitive.Trigger className={styles.select} aria-label={label}>
          <Primitive.Value placeholder={placeholder} />
          <span aria-hidden>⌄</span>
        </Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content className={styles.content} position="popper">
            <Primitive.Viewport>
              {options.map((option) => (
                <Primitive.Item
                  key={option.value}
                  value={option.value || emptyValue}
                  className={styles.item}
                >
                  <Primitive.ItemText>{option.label}</Primitive.ItemText>
                </Primitive.Item>
              ))}
            </Primitive.Viewport>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </label>
  );
}
