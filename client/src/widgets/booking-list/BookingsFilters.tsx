import type { Office } from '../../entities/office';
import { Select } from '../../shared/ui';
import { BookingDateRangePicker } from './BookingDateRangePicker';

export function BookingsFilters({
  offices,
  value,
  from,
  to,
  onChange,
  onDateRangeChange,
}: {
  offices: Office[];
  value?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  onChange: (officeId: string | undefined) => void;
  onDateRangeChange: (range: { from?: string | undefined; to?: string | undefined }) => void;
}) {
  return (
    <>
      <Select
        label="Офис"
        hideLabel
        value={value ?? ''}
        onValueChange={(next) => onChange(next || undefined)}
        options={[
          { value: '', label: 'Все офисы' },
          ...offices.map((office) => ({ value: office.id, label: office.name })),
        ]}
      />
      <BookingDateRangePicker from={from} to={to} onChange={onDateRangeChange} />
    </>
  );
}
