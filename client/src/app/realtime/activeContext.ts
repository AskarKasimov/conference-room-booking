import { z } from 'zod';

const intervalSchema = z.object({ from: z.string(), to: z.string() });

const realtimeActiveContextSchema = z.object({
  selectedRoom: z
    .object({
      roomId: z.string(),
      date: z.string(),
    })
    .optional(),
  roomsList: z
    .object({
      officeId: z.string(),
      interval: intervalSchema,
      filters: z.object({
        officeId: z.string(),
        minCapacity: z.number().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    })
    .optional(),
});

export type RealtimeActiveContext = z.infer<typeof realtimeActiveContextSchema>;

export function parseRealtimeActiveContext(value: unknown): RealtimeActiveContext | undefined {
  const parsed = realtimeActiveContextSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
