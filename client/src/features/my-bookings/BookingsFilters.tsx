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
      onChange={(event) => onChange(event.target.value || undefined)}
    >
      <option value="">Все офисы</option>
      {offices.map((office) => (
        <option key={office.id} value={office.id}>
          {office.name}
        </option>
      ))}
    </Select>
  );
}
