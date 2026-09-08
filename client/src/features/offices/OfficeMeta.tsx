import type { Office } from '../../api/contracts';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

const MSK_OFFSET_HOURS = 3;

export function OfficeMeta({ office, className }: { office: Office; className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timerId: number;

    const scheduleNextUpdate = () => {
      const delay = 60_000 - (Date.now() % 60_000);
      timerId = window.setTimeout(() => {
        setNow(new Date());
        scheduleNextUpdate();
      }, delay);
    };

    scheduleNextUpdate();
    return () => window.clearTimeout(timerId);
  }, []);

  const moscowNow = DateTime.fromJSDate(now).toUTC().plus({ hours: MSK_OFFSET_HOURS });

  return (
    <p className={className}>
      {office.address} · Местное время: {moscowNow.toFormat('HH:mm')} MSK
    </p>
  );
}
