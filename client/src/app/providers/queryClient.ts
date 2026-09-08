import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        return status !== undefined && status >= 400 && status < 500 ? false : failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});
