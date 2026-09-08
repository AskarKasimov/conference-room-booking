export const queryKeys = {
  offices: {
    all: ['offices'] as const,
  },
  rooms: {
    all: ['rooms'] as const,
    list: (filters: Record<string, string | number | undefined>) =>
      ['rooms', 'list', filters] as const,
    detail: (id: string) => ['rooms', 'detail', id] as const,
  },
  schedules: {
    all: ['schedules'] as const,
    byRoom: (id: string, date: string) => ['schedules', id, date] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (filters: Record<string, string | undefined>) => ['bookings', 'list', filters] as const,
  },
};
