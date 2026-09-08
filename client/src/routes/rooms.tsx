import { createFileRoute, Outlet } from '@tanstack/react-router';
import { normalizeRoomsSearch } from '../features/room-search/searchParams';

export const Route = createFileRoute('/rooms')({
  validateSearch: normalizeRoomsSearch,
  component: () => <Outlet />,
});
