import { describe, expect, it } from 'vitest';
import { queryKeys } from '../../src/lib/queryKeys';

describe('query key factories', () => {
  it('uses one serializable hierarchy for server data', () => {
    expect(queryKeys.offices.all).toEqual(['offices']);
    expect(queryKeys.rooms.list({ officeId: 'office-1', from: 'a', to: 'b' })).toEqual([
      'rooms',
      'list',
      { officeId: 'office-1', from: 'a', to: 'b' },
    ]);
    expect(queryKeys.rooms.detail('room-1')).toEqual(['rooms', 'detail', 'room-1']);
    expect(queryKeys.schedules.byRoom('room-1', '2026-09-10')).toEqual([
      'schedules',
      'room-1',
      '2026-09-10',
    ]);
    expect(queryKeys.bookings.list({ scope: 'upcoming' })).toEqual([
      'bookings',
      'list',
      { scope: 'upcoming' },
    ]);
  });
});
