import type {
  BookingView,
  CreateBookingInput,
  ItemsResponse,
  Office,
  Room,
  RoomSummary,
  User,
} from './contracts';
import { request } from './client';

export interface RoomListQuery {
  officeId: string;
  minCapacity?: number;
  from?: string;
  to?: string;
}

export interface BookingListQuery {
  scope?: 'upcoming' | 'past' | 'all';
  officeId?: string;
}

export const api = {
  getCurrentUser: () => request<User>('/api/v1/me'),
  listOffices: () => request<ItemsResponse<Office>>('/api/v1/offices'),
  listRooms: (query: RoomListQuery) =>
    request<ItemsResponse<RoomSummary>>('/api/v1/rooms', { query }),
  getRoom: (roomId: string) => request<Room & { office: Office }>(`/api/v1/rooms/${roomId}`),
  getRoomSchedule: (roomId: string, interval: { from: string; to: string }) =>
    request<ItemsResponse<BookingView>>(`/api/v1/rooms/${roomId}/bookings`, { query: interval }),
  listBookings: (query: BookingListQuery) =>
    request<ItemsResponse<BookingView>>('/api/v1/bookings', { query }),
  createBooking: (input: CreateBookingInput) =>
    request<BookingView>('/api/v1/bookings', { method: 'POST', body: input }),
  cancelBooking: (id: string) => request<void>(`/api/v1/bookings/${id}`, { method: 'DELETE' }),
};
