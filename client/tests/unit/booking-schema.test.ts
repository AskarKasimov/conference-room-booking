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
});
