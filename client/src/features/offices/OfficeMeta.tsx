import type { Office } from '../../api/contracts';
import { DateTime } from 'luxon';

export function OfficeMeta({ office, className }: { office: Office; className?: string }) {
  return (
    <p className={className}>
      {office.address} · местное время {DateTime.now().setZone(office.timezone).toFormat('HH:mm')}
    </p>
  );
}
