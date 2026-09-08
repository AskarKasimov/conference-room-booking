import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/bookings')({ component: () => <h1>Мои бронирования</h1> });
