import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { roomFixture } from '../support/handlers';
import { RoomCard } from '../../src/entities/room';

describe('RoomCard', () => {
  it('allows booking only when the API marks the room available', async () => {
    const user = userEvent.setup();
    const onBook = vi.fn();
    render(
      <MemoryRouter>
        <RoomCard room={roomFixture} availability={true} date="2026-09-10" onBook={onBook} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(onBook).toHaveBeenCalledOnce();
    expect(screen.getByText('Доступно на выбранное время')).toBeInTheDocument();
    expect(screen.getByText('Свободна на выбранное время')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Подробнее' })).toHaveAttribute(
      'href',
      `/rooms/${roomFixture.id}?date=2026-09-10`,
    );
  });

  it('disables booking for an unavailable room', () => {
    render(
      <MemoryRouter>
        <RoomCard
          room={{ ...roomFixture, available: false }}
          availability={false}
          onBook={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled();
    expect(screen.getByText('Недоступно на выбранное время')).toBeInTheDocument();
  });

  it('does not infer availability when the API omits it', () => {
    const roomWithoutAvailability = { ...roomFixture };
    delete roomWithoutAvailability.available;
    render(
      <MemoryRouter>
        <RoomCard room={roomWithoutAvailability} onBook={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Доступность не подтверждена')).toBeInTheDocument();
    expect(screen.getByText('Неизвестна для выбранного времени')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled();
  });
});
