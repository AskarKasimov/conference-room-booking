import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BookingView } from '../../src/entities/booking';
import { DaySchedule } from '../../src/entities/booking';
import { officeFixture, roomFixture } from '../support/handlers';

function bookingAt(startTime: string, durationMinutes: number, userId = 'user-1'): BookingView {
  const [hours, minutes] = startTime.split(':').map(Number);
  if (hours === undefined || minutes === undefined) throw new Error('Invalid fixture time');
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
  it('places a 90-minute 10:30 booking at its hour-grid position', () => {
    render(
      <DaySchedule
        date="2026-09-10"
        timezone="Europe/Moscow"
        bookings={[bookingAt('10:30', 90)]}
        currentUserId="user-1"
      />,
    );

    const block = screen.getByText('Планирование').closest('li');
    expect(block?.style.top).toBe('12.5%');
    expect(block?.style.height).toBe('12.5%');
  });

  it('hides titles of 15-minute bookings for every owner', () => {
    render(
      <DaySchedule
        date="2026-09-10"
        timezone="Europe/Moscow"
        bookings={[bookingAt('10:00', 15, 'user-1'), bookingAt('11:00', 15, 'user-2')]}
        currentUserId="user-1"
      />,
    );

    const blocks = screen.getAllByRole('listitem');
    expect(blocks[0]).toBeEmptyDOMElement();
    expect(blocks[1]).toBeEmptyDOMElement();
    expect(blocks[0]).toHaveAccessibleName('Планирование, 10:00–10:15');
    expect(blocks[1]).toHaveAccessibleName('Занято, 11:00–11:15');
  });

  it('keeps quarter-hour blocks at exact adjacent positions with readable names', () => {
    render(
      <DaySchedule
        date="2026-09-10"
        timezone="Europe/Moscow"
        bookings={[
          bookingAt('10:00', 15),
          bookingAt('10:15', 15, 'user-2'),
          bookingAt('19:45', 15),
        ]}
        currentUserId="user-1"
      />,
    );

    const blocks = screen.getAllByRole('listitem');
    const shortBlock = blocks[2];
    if (!shortBlock) throw new Error('Expected a short booking block');
    expect(blocks[0]).toHaveStyle({ top: '8.3333%', height: '2.0833%' });
    expect(blocks[1]).toHaveStyle({ top: '10.4167%', height: '2.0833%' });
    expect(blocks[2]).toHaveStyle({ top: '89.5833%', height: '2.0833%' });
    expect(blocks[0]).toHaveAccessibleName('Планирование, 10:00–10:15');
    expect(blocks[1]).toHaveAccessibleName('Занято, 10:15–10:30');
    expect(shortBlock).toHaveAttribute('title', 'Планирование, 19:45–20:00 MSK');
    expect(shortBlock).toBeEmptyDOMElement();
    expect(shortBlock).not.toHaveTextContent('19:45');
    expect(shortBlock.querySelector('span')).not.toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });
});
