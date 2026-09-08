import { describe, expect, it } from 'vitest';
import { createBookingSchema } from '../../src/features/booking/bookingSchema';

const base = {
  title: 'Планирование',
  comment: '',
  date: '2026-09-10',
  startTime: '19:45',
  durationMinutes: 15,
};
const now = new Date('2026-09-05T07:00:00.000Z');

describe('booking form schema', () => {
  const schema = createBookingSchema({ now, timezone: 'Europe/Moscow' });

  it('accepts the last valid workday slot and nullable comment', () => {
    expect(schema.parse({ ...base, comment: null })).toMatchObject({
      title: 'Планирование',
      durationMinutes: 15,
    });
  });

  it('rejects blank, too long, past, too-far, and out-of-hours values', () => {
    for (const input of [
      { ...base, title: '  ' },
      { ...base, title: 'x'.repeat(201) },
      { ...base, date: '2026-09-05', startTime: '10:00' },
      { ...base, date: '2026-10-05', startTime: '10:15' },
      { ...base, durationMinutes: 30 },
    ]) {
      expect(() => schema.parse(input)).toThrow();
    }
  });

  it('attaches invalid dates and durations to their own fields', () => {
    const badDate = schema.safeParse({ ...base, date: '2026-02-30' });
    const badDuration = schema.safeParse({ ...base, durationMinutes: 10 });

    expect(badDate.success).toBe(false);
    if (!badDate.success) expect(badDate.error.issues[0]?.path).toEqual(['date']);
    expect(badDuration.success).toBe(false);
    if (!badDuration.success)
      expect(badDuration.error.issues[0]?.path).toEqual(['durationMinutes']);
  });

  it('accepts a comment at the 2000-character limit', () => {
    expect(schema.safeParse({ ...base, comment: 'x'.repeat(2000) }).success).toBe(true);
  });
});
