import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BookingView } from '../../src/api/contracts';
import { DaySchedule } from '../../src/features/room-detail/DaySchedule';
import { officeFixture, roomFixture } from '../support/handlers';

function bookingAt(startTime: string, durationMinutes: number, userId = 'user-1'): BookingView {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(Date.UTC(2026, 8, 10, hours - 3, minutes));
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return {
    id: `${startTime}-${durationMinutes}`,
    roomId: roomFixture.id,
    userId,
    title: 'Планирование',
    comment: null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    createdAt: start.toISOString(),
    room: roomFixture,
    office: officeFixture,
    owner: {
      id: userId,
      login: userId,
      displayName: 'Иван',
      email: 'ivan@example.com',
      avatarUrl: null,
      initials: 'ИВ',
    },
  };
}

describe('DaySchedule', () => {
  it('places a 90-minute 10:30 booking one-sixth down the workday', () => {
    render(
      <DaySchedule
        date="2026-09-10"
        timezone="Europe/Moscow"
        bookings={[bookingAt('10:30', 90)]}
        currentUserId="user-1"
      />,
    );

    const block = screen.getByText('Планирование').closest('li');
    expect(block?.style.top).toBe('13.6364%');
    expect(block?.style.height).toBe('13.6364%');
  });

  it('shows own title and hides another user’s title', () => {
    render(
      <DaySchedule
        date="2026-09-10"
        timezone="Europe/Moscow"
        bookings={[bookingAt('10:00', 30, 'user-1'), bookingAt('11:00', 30, 'user-2')]}
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText('Планирование')).toBeInTheDocument();
    expect(screen.getByText('Занято')).toBeInTheDocument();
  });
});
