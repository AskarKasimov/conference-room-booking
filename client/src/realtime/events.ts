import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { queryKeys } from '../lib/queryKeys';
import { intervalsOverlap, type TimeInterval } from '../lib/time';

const bookingReferenceSchema = z
  .object({
    id: z.string(),
    roomId: z.string(),
    startsAt: z.string(),
    endsAt: z.string(),
  })
  .loose();

const realtimeEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('booking.created'),
    occurredAt: z.string(),
    data: z.object({ booking: bookingReferenceSchema }),
  }),
  z.object({
    type: z.literal('booking.cancelled'),
    occurredAt: z.string(),
    data: z.object({ booking: bookingReferenceSchema }),
  }),
  z.object({
    type: z.literal('room.availability_changed'),
    occurredAt: z.string(),
    data: z.object({
      roomId: z.string(),
      officeId: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
      available: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal('data.reset'),
    occurredAt: z.string(),
    data: z.record(z.string(), z.never()),
  }),
]);

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export interface RealtimeActiveContext {
  selectedRoom?: { roomId: string; date: string };
  roomsList?: {
    officeId: string;
    interval: TimeInterval;
    filters: { officeId: string; minCapacity?: number; from?: string; to?: string };
  };
}

export function parseRealtimeEvent(raw: unknown): RealtimeEvent | undefined {
  const parsed = realtimeEventSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export async function applyRealtimeEvent(
  client: QueryClient,
  event: RealtimeEvent | undefined,
  activeContext: RealtimeActiveContext = {},
): Promise<void> {
  if (!event) return;

  if (event.type === 'booking.created' || event.type === 'booking.cancelled') {
    await client.invalidateQueries({ queryKey: queryKeys.bookings.all });
    if (activeContext.selectedRoom?.roomId === event.data.booking.roomId) {
      await client.invalidateQueries({
        queryKey: queryKeys.schedules.byRoom(
          activeContext.selectedRoom.roomId,
          activeContext.selectedRoom.date,
        ),
      });
    }
    return;
  }

  if (event.type === 'room.availability_changed') {
    const roomsList = activeContext.roomsList;
    if (
      roomsList &&
      roomsList.officeId === event.data.officeId &&
      intervalsOverlap(roomsList.interval, {
        from: event.data.startsAt,
        to: event.data.endsAt,
      })
    ) {
      await client.invalidateQueries({ queryKey: queryKeys.rooms.list(roomsList.filters) });
    }
    return;
  }

  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.offices.all }),
    client.invalidateQueries({ queryKey: queryKeys.rooms.all }),
    client.invalidateQueries({ queryKey: queryKeys.schedules.all }),
    client.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  ]);
}
