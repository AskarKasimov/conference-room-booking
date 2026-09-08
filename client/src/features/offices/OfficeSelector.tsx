import type { Office } from '../../api/contracts';
import { Select } from '../../components/ui/Select';

export function OfficeSelector({
  offices,
  value,
  onChange,
}: {
  offices: Office[];
  value?: string;
  onChange: (officeId: string) => void;
}) {
  return (
    <Select
      label="Офис"
      value={value ?? ''}
      placeholder="Выберите офис"
      onValueChange={onChange}
      options={offices.map((office) => ({ value: office.id, label: office.name }))}
    />
  );
}
