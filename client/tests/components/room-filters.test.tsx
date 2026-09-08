import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RoomFilters } from '../../src/features/room-search/RoomFilters';
import { formatDuration } from '../../src/features/room-search/searchParams';

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

  it('writes a picked calendar date as an atomic date filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: '10 Сентября, Чт' }));
    await user.click(screen.getByRole('button', { name: '11 Сентября, Пт' }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-09-11' }));
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

    await user.click(screen.getByRole('combobox', { name: 'Длительность' }));

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

  it('spells whole-hour durations like the reference', () => {
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Длительность' })).toHaveTextContent('1 час');
  });

  it('uses full Russian hour words for long durations', () => {
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '09:00', duration: 645 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Длительность' })).toHaveTextContent(
      '10 ч 45 мин',
    );
  });

  it('declines hours correctly', () => {
    expect(formatDuration(60)).toBe('1 час');
    expect(formatDuration(120)).toBe('2 часа');
    expect(formatDuration(300)).toBe('5 часов');
    expect(formatDuration(600)).toBe('10 часов');
    expect(formatDuration(645)).toBe('10 ч 45 мин');
  });

  it('formats a chosen capacity as a minimum', () => {
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60, minCapacity: 8 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Вместимость' })).toHaveTextContent(
      'Мин. 8 чел.',
    );
  });
});
