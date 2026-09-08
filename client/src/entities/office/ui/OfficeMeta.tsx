import { DateTime } from 'luxon';
import { formatMoscowOffset, useClock } from '../../../shared/lib';
import type { Office } from '../model/types';

export function OfficeMeta({
  office,
  className,
  separatorClassName,
}: {
  office: Office;
  className?: string | undefined;
  separatorClassName?: string | undefined;
}) {
  const now = useClock();
  const localNow = DateTime.fromJSDate(now).setZone(office.timezone);
  const timeZoneAbbreviation = formatMoscowOffset(office.timezone, now.toISOString());

  return (
    <p className={className}>
      <span>{office.address}</span>
      <span className={separatorClassName} aria-hidden="true" />
      <span>
        Местное время: {localNow.toFormat('HH:mm')} {timeZoneAbbreviation}
      </span>
    </p>
  );
}
