import type { Office } from '../../api/contracts';
import { Select } from '../../components/ui/Select';

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
