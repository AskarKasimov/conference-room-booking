import { DateTime } from 'luxon';
import { useClock } from '../../../shared/lib';
import type { Office } from '../model/types';

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
