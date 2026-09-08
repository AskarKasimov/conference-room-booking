import type { Office } from '../../../entities/office';
import { Select } from '../../../shared/ui';

export function OfficeSelector({
  offices,
  value,
  onChange,
  className,
}: {
  offices: Office[];
  value?: string | undefined;
  onChange: (officeId: string) => void;
  className?: string | undefined;
}) {
  return (
    <Select
      label="Офис"
      value={value ?? ''}
      placeholder="Выберите офис"
      onValueChange={onChange}
      options={offices.map((office) => ({ value: office.id, label: office.name }))}
      className={className}
    />
  );
}
