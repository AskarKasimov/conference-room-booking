export const bookingQueryKeys = {
  all: ['bookings'] as const,
  list: (filters: object) => ['bookings', 'list', filters] as const,
};

export const scheduleQueryKeys = {
  all: ['schedules'] as const,
  byRoom: (id: string, date: string) => ['schedules', id, date] as const,
};
