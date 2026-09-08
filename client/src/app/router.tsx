import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../widgets/app-shell';
import { RoomsPage } from '../pages/rooms';
import { RoomDetailPage } from '../pages/room-detail';
import { BookingsPage } from '../pages/bookings';
import { NotFoundPage } from '../pages/not-found';

export function AppRoutes({ connectionBanner }: { connectionBanner?: ReactNode | undefined }) {
  return (
    <Routes>
      <Route element={<AppShell banner={connectionBanner} />}>
        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
