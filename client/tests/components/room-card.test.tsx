import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { roomFixture } from '../../src/test/handlers';
import { RoomCard } from '../../src/features/room-search/RoomCard';

describe('RoomCard', () => {
  it('allows booking only when the API marks the room available', async () => {
    const user = userEvent.setup();
    const onBook = vi.fn();
    render(<RoomCard room={roomFixture} availability={true} onBook={onBook} />);

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(onBook).toHaveBeenCalledOnce();
    expect(screen.getByText('Доступно на выбранное время')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Подробнее' })).toHaveAttribute(
      'href',
      `/rooms/${roomFixture.id}`,
    );
  });

  it('disables booking for an unavailable room', () => {
    render(
      <RoomCard
        room={{ ...roomFixture, available: false }}
        availability={false}
        onBook={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled();
    expect(screen.getByText('Недоступно на выбранное время')).toBeInTheDocument();
  });
});
