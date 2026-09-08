import type { Office } from '../../api/contracts';
import { DateTime } from 'luxon';
import { useClock } from '../../hooks/useClock';

export function OfficeMeta({
  office,
  className,
}: {
  office: Office;
  className?: string | undefined;
}) {
  const now = useClock();
  const localNow = DateTime.fromJSDate(now).setZone(office.timezone);

  return (
    <p className={className}>
      {office.address} · Местное время: {localNow.toFormat('HH:mm')} ({office.timezone})
    </p>
  );
}
