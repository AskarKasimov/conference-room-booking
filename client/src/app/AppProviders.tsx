import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

export function AppProviders({
  children,
  client = queryClient,
}: PropsWithChildren<{ client?: QueryClient }>) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
