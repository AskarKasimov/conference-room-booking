import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomFilters } from '../../src/features/search-rooms';
import { formatDuration } from '../../src/entities/booking';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-05T07:00:00.000Z'));
});

afterEach(() => vi.useRealTimers());

describe('RoomFilters', () => {
  it('emits numeric capacity and atomic filter values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        timezone="Europe/Moscow"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Вместимость' }));
    await user.click(screen.getByRole('option', { name: '8 чел.' }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ minCapacity: 8 }));
  });

  it('disables dates outside the horizon and omits past start slots for today', async () => {
    const user = userEvent.setup();
    render(
      <RoomFilters
        value={{ date: '2026-09-05', startTime: '09:00', duration: 60 }}
        timezone="Europe/Moscow"
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '5 Сентября, Сб' }));
    expect(screen.getByRole('button', { name: '4 Сентября, Пт' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }));
    expect(screen.getByRole('button', { name: '6 Октября, Вт' })).toBeDisabled();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('combobox', { name: 'Время начала' }));
    expect(screen.queryByRole('option', { name: '10:00' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '10:15' })).toBeInTheDocument();
  });

  it('writes a picked calendar date as an atomic date filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        timezone="Europe/Moscow"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: '10 Сентября, Чт' }));
    await user.click(screen.getByRole('button', { name: '11 Сентября, Пт' }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-09-11' }));
  });

  it('limits the duration to the last 15-minute slot ending at 20:00', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        timezone="Europe/Moscow"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Время начала' }));
    await user.click(screen.getByRole('option', { name: '19:45' }));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ startTime: '19:45', duration: 15 }),
    );
  });

  it('declines hours correctly', () => {
    expect(formatDuration(60)).toBe('1 час');
    expect(formatDuration(120)).toBe('2 часа');
    expect(formatDuration(300)).toBe('5 часов');
    expect(formatDuration(600)).toBe('10 часов');
    expect(formatDuration(645)).toBe('10 ч 45 мин');
  });
});
