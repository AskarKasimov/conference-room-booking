import { useQuery } from '@tanstack/react-query';
import type { BookingListQuery } from '../api/endpoints';
import { api } from '../api/endpoints';
import { queryKeys } from '../lib/queryKeys';

export function useBookingsQuery(filters: BookingListQuery) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: async () => (await api.listBookings(filters)).items,
  });
}
