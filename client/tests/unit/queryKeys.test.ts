import { describe, expect, it } from 'vitest';
import { officeQueryKeys } from '../../src/entities/office';
import { roomQueryKeys } from '../../src/entities/room';
import { bookingQueryKeys, scheduleQueryKeys } from '../../src/entities/booking';

describe('query key factories', () => {
  it('preserves the existing hierarchy for offices, rooms, schedules, and bookings', () => {
    expect(officeQueryKeys.all).toEqual(['offices']);
    expect(roomQueryKeys.list({ officeId: 'office-1', from: 'a', to: 'b' })).toEqual([
      'rooms',
      'list',
      { officeId: 'office-1', from: 'a', to: 'b' },
    ]);
    expect(roomQueryKeys.detail('room-1')).toEqual(['rooms', 'detail', 'room-1']);
    expect(scheduleQueryKeys.byRoom('room-1', '2026-09-10')).toEqual([
      'schedules',
      'room-1',
      '2026-09-10',
    ]);
    expect(bookingQueryKeys.list({ scope: 'upcoming' })).toEqual([
      'bookings',
      'list',
      { scope: 'upcoming' },
    ]);
  });
});
