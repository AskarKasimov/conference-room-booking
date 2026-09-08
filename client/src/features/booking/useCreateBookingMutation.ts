import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { queryKeys } from '../../lib/queryKeys';

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createBooking,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
      ]);
    },
  });
}
