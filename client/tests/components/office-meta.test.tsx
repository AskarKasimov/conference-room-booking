import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfficeMeta } from '../../src/features/offices/OfficeMeta';

const office = {
  id: 'moscow',
  name: 'Офис Москва',
  address: 'Москва, ул. Лесная, 7',
  timezone: 'Europe/Moscow',
};

afterEach(() => {
  vi.useRealTimers();
});

describe('OfficeMeta', () => {
  it('updates the displayed office time at the next minute boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T12:39:45.000Z'));

    render(<OfficeMeta office={office} />);

    expect(screen.getByText(/Местное время: 15:39 MSK/)).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByText(/Местное время: 15:40 MSK/)).toBeVisible();
  });
});
