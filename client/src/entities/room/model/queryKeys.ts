export const roomQueryKeys = {
  all: ['rooms'] as const,
  list: (filters: object) => ['rooms', 'list', filters] as const,
  detail: (id: string) => ['rooms', 'detail', id] as const,
};
