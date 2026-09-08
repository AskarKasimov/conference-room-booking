import type { BookingView } from './types';

export type BookingEvent =
  | {
      type: 'booking.created';
      occurredAt: string;
      data: { booking: BookingView };
    }
  | {
      type: 'booking.cancelled';
      occurredAt: string;
      data: { booking: BookingView };
    }
  | {
      type: 'room.availability_changed';
      occurredAt: string;
      data: {
        roomId: string;
        officeId: string;
        startsAt: string;
        endsAt: string;
        available: boolean;
      };
    }
  | { type: 'data.reset'; occurredAt: string; data: Record<string, never> };
