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
    <Select label="Офис" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
      <option value="">Выберите офис</option>
      {offices.map((office) => (
        <option key={office.id} value={office.id}>
          {office.name}
        </option>
      ))}
    </Select>
  );
}
