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
  const offsetFromMoscow = localNow.offset - localNow.setZone('Europe/Moscow').offset;
  const absoluteOffset = Math.abs(offsetFromMoscow);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetMinutes = absoluteOffset % 60;
  const offsetLabel = `${offsetHours}${offsetMinutes ? `:${String(offsetMinutes).padStart(2, '0')}` : ''}`;
  const timeZoneAbbreviation = Number.isFinite(offsetFromMoscow)
    ? offsetFromMoscow === 0
      ? 'MSK'
      : `MSK${offsetFromMoscow > 0 ? '+' : '-'}${offsetLabel}`
    : '';

  return (
    <p className={className}>
      {office.address} · Местное время: {localNow.toFormat('HH:mm')} {timeZoneAbbreviation}
    </p>
  );
}
