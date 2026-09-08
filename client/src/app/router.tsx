import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../widgets/app-shell';
import { RoomsPage } from '../pages/rooms';
import { RoomDetailPage } from '../pages/room-detail';
import { BookingsPage } from '../pages/bookings';
import { NotFoundPage } from '../pages/not-found';
import { useSectionNavigation } from './useSectionNavigation';

export function AppRoutes({ connectionBanner }: { connectionBanner?: ReactNode | undefined }) {
  const { roomsHref, bookingsHref, roomsListHref } = useSectionNavigation();
  return (
    <Routes>
      <Route
        element={
          <AppShell banner={connectionBanner} roomsHref={roomsHref} bookingsHref={bookingsHref} />
        }
      >
        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:roomId" element={<RoomDetailPage roomsListHref={roomsListHref} />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
