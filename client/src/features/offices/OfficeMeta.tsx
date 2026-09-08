import type { Office } from '../../api/contracts';
import { DateTime } from 'luxon';

export function OfficeMeta({ office }: { office: Office }) {
  return (
    <p>
      {office.address} · местное время {DateTime.now().setZone(office.timezone).toFormat('HH:mm')}
    </p>
  );
}
