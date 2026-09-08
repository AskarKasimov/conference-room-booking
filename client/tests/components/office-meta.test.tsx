import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfficeMeta } from '../../src/entities/office';

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

    expect(screen.getByText(/Местное время: 15:39 \(Europe\/Moscow\)/)).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByText(/Местное время: 15:40 \(Europe\/Moscow\)/)).toBeVisible();
  });

  it('uses the selected office zone and its daylight-saving rules', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'));
    const berlin = { ...office, timezone: 'Europe/Berlin' };
    const view = render(<OfficeMeta office={berlin} />);

    expect(screen.getByText(/Местное время: 14:00 \(Europe\/Berlin\)/)).toBeVisible();

    view.unmount();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    render(<OfficeMeta office={berlin} />);

    expect(screen.getByText(/Местное время: 13:00 \(Europe\/Berlin\)/)).toBeVisible();
  });
});
