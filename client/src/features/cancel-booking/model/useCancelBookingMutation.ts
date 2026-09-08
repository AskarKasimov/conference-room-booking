import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBooking } from '../../../entities/booking';
import { bookingQueryKeys, scheduleQueryKeys } from '../../../entities/booking';
import type { BookingView } from '../../../entities/booking';
import { roomQueryKeys } from '../../../entities/room';

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: async (_data, bookingId) => {
      queryClient.setQueriesData<BookingView[]>({ queryKey: bookingQueryKeys.all }, (bookings) =>
        bookings?.filter((booking) => booking.id !== bookingId),
      );
      queryClient.setQueriesData<BookingView[]>({ queryKey: scheduleQueryKeys.all }, (bookings) =>
        bookings?.filter((booking) => booking.id !== bookingId),
      );
      await queryClient.invalidateQueries({ queryKey: roomQueryKeys.all });
    },
  });
}
