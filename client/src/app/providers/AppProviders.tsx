import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { RealtimeProvider, type RealtimeStatus } from '../realtime';

export function AppProviders({
  children,
  client = queryClient,
}: {
  children: ReactNode | ((status: RealtimeStatus) => ReactNode);
  client?: QueryClient;
}) {
  return (
    <QueryClientProvider client={client}>
      <RealtimeProvider>
        {(status) => (typeof children === 'function' ? children(status) : children)}
      </RealtimeProvider>
    </QueryClientProvider>
  );
}
