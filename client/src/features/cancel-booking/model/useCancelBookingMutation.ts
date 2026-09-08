import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBooking } from '../../../entities/booking';
import { bookingQueryKeys, scheduleQueryKeys } from '../../../entities/booking';
import { roomQueryKeys } from '../../../entities/room';

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: roomQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
      ]);
    },
  });
}
