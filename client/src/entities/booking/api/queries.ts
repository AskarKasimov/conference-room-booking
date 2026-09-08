import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRoomSchedule, listBookings } from './endpoints';
import type { BookingListQuery } from './types';
import { getWorkdayInterval } from '../../../shared/lib';
import { bookingQueryKeys, scheduleQueryKeys } from '../model/queryKeys';

export function useBookingsQuery(filters: BookingListQuery) {
  return useQuery({
    queryKey: bookingQueryKeys.list(filters),
    queryFn: async () => (await listBookings(filters)).items,
    placeholderData: keepPreviousData,
  });
}

export function useRoomScheduleQuery(
  roomId: string,
  date: string,
  timezone: string,
  enabled = true,
) {
  const interval = date ? getWorkdayInterval(date, timezone) : undefined;
  return useQuery({
    queryKey: scheduleQueryKeys.byRoom(roomId, date),
    queryFn: async () => {
      if (!interval) throw new Error('Для расписания нужна дата.');
      return (await getRoomSchedule(roomId, interval)).items;
    },
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(interval),
  });
}
