import { z } from 'zod';

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

export function parseRealtimeEvent(raw: unknown): RealtimeEvent | undefined {
  const parsed = realtimeEventSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}
