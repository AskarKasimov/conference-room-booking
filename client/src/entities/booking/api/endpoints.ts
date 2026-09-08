import type { ItemsResponse } from '../../../shared/api';
import { request } from '../../../shared/api';
import type { BookingListQuery } from './types';
import type { BookingView, CreateBookingInput } from '../model/types';

export function getRoomSchedule(roomId: string, interval: { from: string; to: string }) {
  return request<ItemsResponse<BookingView>>(`/api/v1/rooms/${roomId}/bookings`, {
    query: interval,
  });
}

export function listBookings(query: BookingListQuery) {
  return request<ItemsResponse<BookingView>>('/api/v1/bookings', { query });
}

export function createBooking(input: CreateBookingInput) {
  return request<BookingView>('/api/v1/bookings', { method: 'POST', body: input });
}

export function cancelBooking(id: string) {
  return request<void>(`/api/v1/bookings/${id}`, { method: 'DELETE' });
}

export type { BookingListQuery } from './types';
