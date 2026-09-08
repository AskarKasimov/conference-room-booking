export interface User {
  id: string;
  login: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
}

export interface Office {
  id: string;
  name: string;
  address: string;
  timezone: string;
}

export interface RoomFeature {
  code: string;
  name: string;
}

export interface Room {
  id: string;
  officeId: string;
  name: string;
  floor: number;
  capacity: number;
  features: RoomFeature[];
}

export interface RoomSummary extends Room {
  office: Office;
  available?: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  comment: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface BookingView extends Booking {
  room: Room;
  office: Office;
  owner: User;
}

export interface ItemsResponse<T> {
  items: T[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface CreateBookingInput {
  roomId: string;
  title: string;
  comment: string | null;
  startsAt: string;
  endsAt: string;
}

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
