import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { createBooking } from '../../../entities/booking';
import { bookingQueryKeys, scheduleQueryKeys } from '../../../entities/booking';
import type { BookingListQuery, BookingView } from '../../../entities/booking';
import { roomQueryKeys } from '../../../entities/room';

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: async (booking) => {
      queryClient
        .getQueryCache()
        .findAll({ queryKey: bookingQueryKeys.all })
        .forEach((query) => {
          const filters = query.queryKey[2] as BookingListQuery | undefined;
          const isUpcoming = Date.parse(booking.startsAt) > Date.now();
          if (
            (filters?.officeId && filters.officeId !== booking.office.id) ||
            (filters?.scope === 'upcoming' && !isUpcoming) ||
            (filters?.scope === 'past' && isUpcoming)
          ) {
            return;
          }
          queryClient.setQueryData<BookingView[]>(query.queryKey, (bookings) => {
            if (!bookings || bookings.some((item) => item.id === booking.id)) return bookings;
            const direction = filters?.scope === 'past' ? -1 : 1;
            return [...bookings, booking].sort(
              (left, right) => direction * (Date.parse(left.startsAt) - Date.parse(right.startsAt)),
            );
          });
        });

      queryClient
        .getQueryCache()
        .findAll({ queryKey: scheduleQueryKeys.all })
        .forEach((query) => {
          const [, roomId, date] = query.queryKey;
          if (
            roomId !== booking.roomId ||
            date !==
              DateTime.fromISO(booking.startsAt, { setZone: true })
                .setZone(booking.office.timezone)
                .toISODate()
          ) {
            return;
          }
          queryClient.setQueryData<BookingView[]>(query.queryKey, (bookings) => {
            if (!bookings || bookings.some((item) => item.id === booking.id)) return bookings;
            return [...bookings, booking].sort(
              (left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt),
            );
          });
        });

      await queryClient.invalidateQueries({ queryKey: roomQueryKeys.all });
    },
  });
}
