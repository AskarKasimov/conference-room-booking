import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '../../../entities/booking';
import { bookingQueryKeys, scheduleQueryKeys } from '../../../entities/booking';
import { roomQueryKeys } from '../../../entities/room';

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all }),
      ]);
    },
  });
}
