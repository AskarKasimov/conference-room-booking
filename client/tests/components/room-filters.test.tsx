import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RoomFilters } from '../../src/features/room-search/RoomFilters';

describe('RoomFilters', () => {
  it('emits numeric capacity and atomic filter values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Вместимость' }));
    await user.click(screen.getByRole('option', { name: '8 чел.' }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ minCapacity: 8 }));
  });

  it('offers the capacity steps shown in the filter spec', async () => {
    const user = userEvent.setup();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Вместимость' }));
    expect(screen.getByRole('option', { name: '6 чел.' })).toBeInTheDocument();
  });

  it('writes duration using whole hours and minutes', async () => {
    const user = userEvent.setup();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Продолжительность' }));

    expect(screen.getByRole('option', { name: '1 ч 30 мин' })).toBeInTheDocument();
  });

  it('opens the start-time options in a listbox', async () => {
    const user = userEvent.setup();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Время начала' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '19:45' })).toBeInTheDocument();
  });

  it('limits the duration to the last 15-minute slot ending at 20:00', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Время начала' }));
    await user.click(screen.getByRole('option', { name: '19:45' }));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ startTime: '19:45', duration: 15 }),
    );
  });

  it('shows the default capacity label', () => {
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Вместимость' })).toHaveTextContent('Любая');
  });
});
