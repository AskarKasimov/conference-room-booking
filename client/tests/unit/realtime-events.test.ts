import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import {
  applyRealtimeEvent,
  parseRealtimeEvent,
  type RealtimeActiveContext,
} from '../../src/realtime/events';
import { queryKeys } from '../../src/lib/queryKeys';

const activeContext: RealtimeActiveContext = {
  selectedRoom: { roomId: 'room-everest', date: '2026-09-10' },
  roomsList: {
    officeId: 'office-moscow',
    interval: { from: '2026-09-10T10:00:00.000Z', to: '2026-09-10T11:00:00.000Z' },
    filters: {
      officeId: 'office-moscow',
      from: '2026-09-10T10:00:00.000Z',
      to: '2026-09-10T11:00:00.000Z',
    },
  },
};

const bookingEvent = (type: 'booking.created' | 'booking.cancelled', roomId = 'room-everest') => ({
  type,
  occurredAt: '2026-09-05T10:00:00.000Z',
  data: {
    booking: {
      id: 'booking-1',
      roomId,
      startsAt: '2026-09-10T10:30:00.000Z',
      endsAt: '2026-09-10T11:00:00.000Z',
    },
  },
});

describe('realtime event invalidation', () => {
  let client: QueryClient;
  let invalidateQueries: MockInstance<QueryClient['invalidateQueries']>;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidateQueries = vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
  });

  it('invalidates booking lists and the open room schedule', async () => {
    const event = parseRealtimeEvent(bookingEvent('booking.created'));
    await applyRealtimeEvent(client, event, activeContext);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.all });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.schedules.byRoom('room-everest', '2026-09-10'),
    });
  });

  it('does not invalidate the schedule for another room', async () => {
    const event = parseRealtimeEvent(bookingEvent('booking.cancelled', 'room-atlas'));
    await applyRealtimeEvent(client, event, activeContext);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.all });
  });

  it('invalidates the matching rooms list only for overlapping availability', async () => {
    const event = parseRealtimeEvent({
      type: 'room.availability_changed',
      occurredAt: '2026-09-05T10:00:00.000Z',
      data: {
        roomId: 'room-everest',
        officeId: 'office-moscow',
        startsAt: '2026-09-10T10:30:00.000Z',
        endsAt: '2026-09-10T10:45:00.000Z',
        available: false,
      },
    });
    await applyRealtimeEvent(client, event, activeContext);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.rooms.list(activeContext.roomsList?.filters ?? {}),
    });

    invalidateQueries.mockClear();
    await applyRealtimeEvent(
      client,
      parseRealtimeEvent({
        ...event,
        data: {
          ...event?.data,
          startsAt: '2026-09-10T11:00:00.000Z',
          endsAt: '2026-09-10T11:30:00.000Z',
        },
      }),
      activeContext,
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('invalidates all server-state domains on reset and ignores invalid input', async () => {
    await applyRealtimeEvent(client, parseRealtimeEvent({ type: 'unknown' }), activeContext);
    expect(invalidateQueries).not.toHaveBeenCalled();

    await applyRealtimeEvent(
      client,
      parseRealtimeEvent({ type: 'data.reset', occurredAt: '2026-09-05T10:00:00.000Z', data: {} }),
      activeContext,
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.offices.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.rooms.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.schedules.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.all });
  });
});
