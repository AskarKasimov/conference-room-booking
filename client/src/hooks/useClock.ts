import { useEffect, useState } from 'react';

export function useClock(nextChangeAt?: number): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const currentTime = Date.now();
    const nextMinute = 60_000 - (currentTime % 60_000);
    const untilBoundary =
      nextChangeAt !== undefined && nextChangeAt > currentTime
        ? nextChangeAt - currentTime
        : Number.POSITIVE_INFINITY;
    const timer = window.setTimeout(
      () => setNow(new Date()),
      Math.max(1, Math.min(nextMinute, untilBoundary)),
    );
    return () => window.clearTimeout(timer);
  }, [now, nextChangeAt]);

  return now;
}
