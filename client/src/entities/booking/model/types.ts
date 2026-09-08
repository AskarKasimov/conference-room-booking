import type { Office } from '../../office';
import type { Room } from '../../room';
import type { User } from '../../user';

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

export interface CreateBookingInput {
  roomId: string;
  title: string;
  comment: string | null;
  startsAt: string;
  endsAt: string;
}
