import * as Primitive from '@radix-ui/react-select';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import styles from './Select.module.scss';

const emptyValue = '__empty_option__';

export function Select({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  className,
  hideLabel = false,
  id,
  ariaInvalid,
  ariaDescribedBy,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string | undefined;
  hideLabel?: boolean;
  id?: string | undefined;
  ariaInvalid?: boolean | undefined;
  ariaDescribedBy?: string | undefined;
}) {
  const radixValue = value || (options.some((option) => option.value === '') ? emptyValue : '');
  return (
    <label className={`${styles.field} ${className ?? ''}`}>
      {hideLabel ? null : <span>{label}</span>}
      <Primitive.Root
        value={radixValue}
        onValueChange={(next) => onValueChange(next === emptyValue ? '' : next)}
      >
        <Primitive.Trigger
          id={id}
          className={styles.select}
          aria-label={label}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        >
          <Primitive.Value placeholder={placeholder} />
          <ChevronDownIcon className={styles.chevron} aria-hidden="true" />
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
