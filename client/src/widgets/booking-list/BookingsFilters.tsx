import type { Office } from '../../entities/office';
import { Select } from '../../shared/ui';
import CalendarIcon from '../../shared/assets/icons/calendar.svg?react';

export function BookingsFilters({
  offices,
  value,
  period,
  onChange,
  onPeriodChange,
}: {
  offices: Office[];
  value?: string | undefined;
  period: string;
  onChange: (officeId: string | undefined) => void;
  onPeriodChange: (period: string) => void;
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
      <Select
        label="Период"
        hideLabel
        value={period}
        leadingIcon={CalendarIcon}
        onValueChange={onPeriodChange}
        options={[
          { value: 'all', label: 'За все время' },
          { value: '30d', label: 'За месяц' },
          { value: '90d', label: 'За 3 месяца' },
        ]}
      />
    </>
  );
}
