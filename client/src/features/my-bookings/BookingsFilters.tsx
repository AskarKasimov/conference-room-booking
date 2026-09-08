import type { Office } from '../../api/contracts';
import { Select } from '../../components/ui/Select';

export function BookingsFilters({
  offices,
  value,
  onChange,
}: {
  offices: Office[];
  value?: string;
  onChange: (officeId: string | undefined) => void;
}) {
  return (
    <Select
      label="Офис"
      value={value ?? ''}
      onValueChange={(next) => onChange(next || undefined)}
      options={[
        { value: '', label: 'Все офисы' },
        ...offices.map((office) => ({ value: office.id, label: office.name })),
      ]}
    />
  );
}
